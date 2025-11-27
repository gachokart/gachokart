// server.js
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Підключення до PostgreSQL (Render дає тобі DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Віддавати статичні файли з public/
app.use(express.static(path.join(__dirname, "public")));

// Корінь сайту -> index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================
// API: отримати матчі з гравцями та героями
// ============================
app.get("/api/matches", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.match_id,
             m.start_time,
             m.duration,
             m.radiant_win,
             p.account_id,
             p.player_slot,
             p.is_radiant,
             p.hero_id,
             h.hero_name,
             p.role,
             p.booster_ruiner,
             p.kills,
             p.deaths,
             p.assists
      FROM matches m
      LEFT JOIN players p ON m.match_id = p.match_id
      LEFT JOIN heroes h ON p.hero_id = h.hero_id
      ORDER BY m.start_time DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// API: додати новий матч
// ============================
app.post("/api/matches", async (req, res) => {
  const { match_id, start_time, duration, radiant_win } = req.body;
  try {
    await pool.query(
      `INSERT INTO matches (match_id, start_time, duration, radiant_win)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (match_id) DO NOTHING`,
      [match_id, start_time, duration, radiant_win]
    );
    res.json({ message: "Match added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// API: додати гравця у матч
// ============================
app.post("/api/players", async (req, res) => {
  const { match_id, account_id, player_slot, hero_id, role, booster_ruiner } = req.body;
  try {
    await pool.query(
      `INSERT INTO players (match_id, account_id, player_slot, hero_id, role, booster_ruiner)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [match_id, account_id, player_slot, hero_id, role, booster_ruiner]
    );
    res.json({ message: "Player added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// Запуск сервера
// ============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
