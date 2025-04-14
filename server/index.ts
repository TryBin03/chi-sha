import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { mkdirSync } from 'fs';
import { dirname as pathDirname } from 'path';

// 根据环境加载配置
dotenv.config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production'
    : '.env'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// 从环境变量获取管理密码
const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('错误：未设置管理密码！请在环境变量中设置 VITE_ADMIN_PASSWORD');
  process.exit(1);
}

// 数据库路径
const DB_PATH = process.env.DB_PATH || join(__dirname, 'dishes.db');

// 确保数据目录存在
mkdirSync(pathDirname(DB_PATH), { recursive: true });

// 生成一个随机的密钥用于 token 签名
const SECRET_KEY = crypto.randomBytes(32).toString('hex');

// 生成 token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 存储有效的 tokens（在实际生产环境中应该使用 Redis 等数据库存储）
const validTokens = new Set<string>();

// 中间件
app.use(cors());
app.use(express.json());

// 验证 token 的中间件
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers['x-auth-token'];
  
  if (!token || typeof token !== 'string' || !validTokens.has(token)) {
    res.status(401).json({ error: '未授权的操作' });
    return;
  }
  
  next();
};

// 验证菜品数据的中间件
const validateDishData = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { name, type, category } = req.body;
  
  if (!name || name.trim() === '') {
    res.status(400).json({ error: '菜品名称不能为空' });
    return;
  }
  
  if (!['meat', 'vegetable', 'soup'].includes(type)) {
    res.status(400).json({ error: '无效的菜品类型' });
    return;
  }
  
  next();
};

// 数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('成功连接到数据库');
    
    // 开始事务
    db.serialize(() => {
      // 创建临时表
      db.run(`CREATE TABLE IF NOT EXISTS dishes_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        category TEXT NOT NULL
      )`);

      // 复制数据到临时表
      db.run(`INSERT OR IGNORE INTO dishes_temp (id, name, type, category)
              SELECT id, name, type, category FROM dishes`);

      // 删除旧表
      db.run(`DROP TABLE IF EXISTS dishes`);

      // 重命名临时表为新表
      db.run(`ALTER TABLE dishes_temp RENAME TO dishes`);

      // 创建推荐记录表
      createRecommendationTable();
    });
  }
});

// 创建推荐记录表
const createRecommendationTable = () => {
  db.run(`CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id INTEGER NOT NULL,
    recommended_date DATE NOT NULL,
    FOREIGN KEY(dish_id) REFERENCES dishes(id)
  )`);
  
  // 创建周菜单表
  db.run(`CREATE TABLE IF NOT EXISTS week_menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day INTEGER NOT NULL,
    meat_dish_id INTEGER,
    vegetable_dish_id INTEGER,
    soup_dish_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(meat_dish_id) REFERENCES dishes(id),
    FOREIGN KEY(vegetable_dish_id) REFERENCES dishes(id),
    FOREIGN KEY(soup_dish_id) REFERENCES dishes(id)
  )`);
};

// API 路由
// 添加新菜品（需要 token 验证）
app.post('/api/dishes', verifyToken, validateDishData, (req, res) => {
  const { name, type, category } = req.body;
  const sql = 'INSERT INTO dishes (name, type, category) VALUES (?, ?, ?)';
  db.run(sql, [name, type, category], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'DUPLICATE_NAME' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// 获取所有菜品（公开访问）
app.get('/api/dishes', (req, res) => {
  const sql = 'SELECT * FROM dishes ORDER BY name COLLATE NOCASE';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 获取推荐菜品
app.post('/api/recommend', (req, res) => {
  const { meat, vegetable, soup, noRepeatInWeek } = req.body;
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const getDishesQuery = (type) => {
    let query = `SELECT * FROM dishes WHERE type = ?`;
    if (noRepeatInWeek) {
      query += ` AND id NOT IN (SELECT dish_id FROM recommendations WHERE recommended_date >= ?)`;
    }
    return query;
  };

  const getDishes = (type, count, callback) => {
    const query = getDishesQuery(type);
    const params = noRepeatInWeek ? [type, oneWeekAgo.toISOString()] : [type];
    db.all(query, params, (err, rows) => {
      if (err) {
        callback(err);
      } else {
        const selectedDishes = rows.sort(() => 0.5 - Math.random()).slice(0, count);
        callback(null, selectedDishes);
      }
    });
  };

  const updateRecommendations = (dishes) => {
    const stmt = db.prepare(`INSERT INTO recommendations (dish_id, recommended_date) VALUES (?, ?)`);
    dishes.forEach(dish => {
      stmt.run(dish.id, today.toISOString());
    });
    stmt.finalize();
  };

  const recommendations = { meat: [], vegetable: [], soup: [] };

  getDishes('meat', meat, (err, meatDishes) => {
    if (err) return res.status(500).json({ error: '获取推荐失败' });
    recommendations.meat = meatDishes;
    updateRecommendations(meatDishes);

    getDishes('vegetable', vegetable, (err, vegetableDishes) => {
      if (err) return res.status(500).json({ error: '获取推荐失败' });
      recommendations.vegetable = vegetableDishes;
      updateRecommendations(vegetableDishes);

      getDishes('soup', soup, (err, soupDishes) => {
        if (err) return res.status(500).json({ error: '获取推荐失败' });
        recommendations.soup = soupDishes;
        updateRecommendations(soupDishes);

        res.json(recommendations);
      });
    });
  });
});

// 获取当前周菜单
app.get('/api/week-menu', (req, res) => {
  db.all(`SELECT wm.id, wm.day, d.id as dish_id, d.name, d.type, d.category 
          FROM week_menu wm
          JOIN dishes d ON wm.dish_id = d.id
          ORDER BY wm.day ASC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '获取周菜单失败', details: err.message });
    }
    res.json(rows);
  });
});

// 生成新的周菜单
app.post('/api/week-menu/generate', (req, res) => {
  const today = new Date();
  
  // 先清空现有的周菜单
  db.run(`DELETE FROM week_menu`, [], (err) => {
    if (err) {
      return res.status(500).json({ error: '重置周菜单失败', details: err.message });
    }
    
    // 获取所有菜品并按类型分类
    db.all(`SELECT * FROM dishes`, [], (err, allDishes) => {
      if (err) {
        return res.status(500).json({ error: '获取菜品失败', details: err.message });
      }
      
      const meatDishes = allDishes.filter(d => d.type === 'meat');
      const vegetableDishes = allDishes.filter(d => d.type === 'vegetable');
      const soupDishes = allDishes.filter(d => d.type === 'soup');
      
      // 检查是否有足够的菜品
      if (meatDishes.length < 7 || vegetableDishes.length < 7 || (soupDishes.length < 7 && soupDishes.length > 0)) {
        return res.status(400).json({ error: '菜品数量不足，无法生成7天的菜单' });
      }
      
      // 随机排序各类菜品
      const shuffledMeat = [...meatDishes].sort(() => 0.5 - Math.random());
      const shuffledVegetable = [...vegetableDishes].sort(() => 0.5 - Math.random());
      const shuffledSoup = [...soupDishes].sort(() => 0.5 - Math.random());
      
      // 使用事务确保所有操作原子性
      db.serialize(() => {
        const stmt = db.prepare(`INSERT INTO week_menu 
          (day, meat_dish_id, vegetable_dish_id, soup_dish_id) 
          VALUES (?, ?, ?, ?)`);
        
        // 为每天生成一组菜品
        for (let day = 0; day < 7; day++) {
          stmt.run(
            day,
            shuffledMeat[day]?.id || null,
            shuffledVegetable[day]?.id || null,
            shuffledSoup[day]?.id || null
          );
        }
        
        stmt.finalize(() => {
          // 返回生成的完整菜单
          db.all(`
            SELECT 
              wm.id, wm.day, 
              d1.id as meat_id, d1.name as meat_name,
              d2.id as vegetable_id, d2.name as vegetable_name,
              d3.id as soup_id, d3.name as soup_name
            FROM week_menu wm
            LEFT JOIN dishes d1 ON wm.meat_dish_id = d1.id
            LEFT JOIN dishes d2 ON wm.vegetable_dish_id = d2.id
            LEFT JOIN dishes d3 ON wm.soup_dish_id = d3.id
            ORDER BY wm.day ASC
          `, [], (err, rows) => {
            if (err) {
              return res.status(500).json({ error: '获取新生成的周菜单失败', details: err.message });
            }
            res.json(rows);
          });
        });
      });
    });
  });
});

// 更新某一天的菜单
app.put('/api/week-menu/day/:day', (req, res) => {
  const day = parseInt(req.params.day);
  
  if (isNaN(day) || day < 0 || day > 6) {
    return res.status(400).json({ error: '无效的日期索引，应为0-6之间的整数' });
  }
  
  // 获取当前周菜单中已有的菜品ID
  db.all(`SELECT dish_id FROM week_menu WHERE day != ?`, [day], (err, usedDishes) => {
    if (err) {
      return res.status(500).json({ error: '获取当前菜单失败', details: err.message });
    }
    
    const usedDishIds = usedDishes.map(d => d.dish_id);
    
    // 获取未使用的菜品
    db.all(`SELECT * FROM dishes WHERE id NOT IN (${usedDishIds.length > 0 ? usedDishIds.join(',') : -1})`, [], (err, availableDishes) => {
      if (err) {
        return res.status(500).json({ error: '获取可用菜品失败', details: err.message });
      }
      
      if (availableDishes.length === 0) {
        return res.status(400).json({ error: '没有可用的不重复菜品' });
      }
      
      // 随机选择一个新菜品
      const selectedDish = availableDishes[Math.floor(Math.random() * availableDishes.length)];
      
      // 更新特定日期的菜单
      db.run(`UPDATE week_menu SET dish_id = ? WHERE day = ?`, [selectedDish.id, day], function(err) {
        if (err) {
          return res.status(500).json({ error: '更新菜单失败', details: err.message });
        }
        
        if (this.changes === 0) {
          // 如果没有更新任何行，说明这一天可能还没有记录，需要插入
          db.run(`INSERT INTO week_menu (day, dish_id) VALUES (?, ?)`, [day, selectedDish.id], (err) => {
            if (err) {
              return res.status(500).json({ error: '创建菜单失败', details: err.message });
            }
            
            res.json({748123
              day,
              dish_id: selectedDish.id,
              name: selectedDish.name,
              type: selectedDish.type,
              category: selectedDish.category
            });
          });
        } else {
          res.json({
            day,
            dish_id: selectedDish.id,
            name: selectedDish.name,
            type: selectedDish.type,
            category: selectedDish.category
          });
        }
      });
    });
  });
});

// 删除菜品（需要 token 验证）
app.delete('/api/dishes/:id', verifyToken, (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM dishes WHERE id = ?';
  db.run(sql, id, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: '删除成功' });
  });
});

// 修改菜品（需要 token 验证）
app.put('/api/dishes/:id', verifyToken, validateDishData, (req, res) => {
  const id = req.params.id;
  const { name, type, category } = req.body;
  const sql = 'UPDATE dishes SET name = ?, type = ?, category = ? WHERE id = ?';
  db.run(sql, [name, type, category, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'DUPLICATE_NAME' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: '修改成功' });
  });
});

// 登录并获取 token
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = generateToken();
    validTokens.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

// 登出（使 token 失效）
app.post('/api/logout', verifyToken, (req, res) => {
  const token = req.headers['x-auth-token'] as string;
  validTokens.delete(token);
  res.json({ message: '登出成功' });
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});