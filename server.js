// server.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ให้เสิร์ฟไฟล์หน้าเว็บ (index.html, register.html, page1.html) จากโฟลเดอร์ปัจจุบัน
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME,   // ชื่อ DB ของคุณ: ranzxnya's Projectg
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'กรุณากรอก username และ password' });
    }
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const q = 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at';
    const { rows } = await pool.query(q, [username, passwordHash]);
    return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    // duplicate username?
    if (err && err.code === '23505') {
      return res.status(409).json({ ok: false, message: 'Username นี้ถูกใช้แล้ว' });
    }
    console.error(err);
    return res.status(500).json({ ok: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'กรุณากรอก username และ password' });
    }

    const q = 'SELECT id, username, password_hash FROM users WHERE username = $1 LIMIT 1';
    const { rows } = await pool.query(q, [username]);
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // สำเร็จ
    return res.json({ ok: true, message: 'เข้าสู่ระบบสำเร็จ' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
