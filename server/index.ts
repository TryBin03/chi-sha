import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接
const db = new sqlite3.Database(join(__dirname, 'dishes.db'), (err) => {
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
  }
});

// API 路由
// 添加新菜品
app.post('/api/dishes', (req, res) => {
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

// 获取所有菜品
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

// 随机获取菜品
app.post('/api/recommend', (req, res) => {
  const { meat, vegetable, soup } = req.body;
  const recommendations: any = { meat: [], vegetable: [], soup: [] };
  
  const getRandomDishes = (type: string, count: number) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM dishes WHERE type = ? ORDER BY RANDOM() LIMIT ?',
        [type, count],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  };

  Promise.all([
    getRandomDishes('meat', meat),
    getRandomDishes('vegetable', vegetable),
    getRandomDishes('soup', soup)
  ])
    .then(([meatDishes, vegDishes, soupDishes]) => {
      recommendations.meat = meatDishes;
      recommendations.vegetable = vegDishes;
      recommendations.soup = soupDishes;
      res.json(recommendations);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 