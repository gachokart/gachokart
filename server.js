const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
app.use(express.json());

// Підключення до PostgreSQL через Environment Variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Віддавати статичні файли (наприклад game1.html)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game1.html"));
});

// API: отримати всі матчі
app.get("/api/matches", async (req, res) => {
  const result = await pool.query("SELECT * FROM matches ORDER BY id DESC");
  res.json({ matches: result.rows });
});

// API: додати новий матч
app.post("/api/matches", async (req, res) => {
  const { match_id, hero_id, role, booster_ruiner } = req.body;

  await pool.query(
    `INSERT INTO matches (match_id, hero_id, role, booster_ruiner, start_time, radiant_win, kills, deaths, assists)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [match_id, hero_id, role, booster_ruiner, Date.now(), null, 0, 0, 0]
  );

  res.json({ message: "Match added successfully!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
