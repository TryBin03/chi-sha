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
    // 创建菜品表
    db.run(`CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL
    )`);
    createRecommendationTable();
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
};

// API 路由
// 添加新菜品（需要 token 验证）
app.post('/api/dishes', verifyToken, validateDishData, (req, res) => {
  const { name, type, category } = req.body;
  const sql = 'INSERT INTO dishes (name, type, category) VALUES (?, ?, ?)';
  db.run(sql, [name, type, category], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// 获取所有菜品（公开访问）
app.get('/api/dishes', (req, res) => {
  const sql = 'SELECT * FROM dishes';
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