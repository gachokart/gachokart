// server.js (CommonJS)
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET all matches
app.get("/api/matches", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM matches ORDER BY match_id DESC");
    res.json(result.rows || []); // завжди масив
  } catch (err) {
    console.error("Error fetching matches:", err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// POST new match
app.post("/api/matches", async (req, res) => {
  const {
    match_id,
    hero_id,
    role,
    booster_ruiner,
    radiant_win,
    kills,
    deaths,
    assists
  } = req.body;

  // Перевірка обов'язкових полів
  if (!match_id || !hero_id) {
    return res.status(400).json({ error: "match_id and hero_id are required" });
  }

  try {
    const query = `
      INSERT INTO matches (match_id, hero_id, role, booster_ruiner, radiant_win, kills, deaths, assists)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (match_id) DO UPDATE
        SET hero_id = EXCLUDED.hero_id,
            role = EXCLUDED.role,
            booster_ruiner = EXCLUDED.booster_ruiner,
            radiant_win = EXCLUDED.radiant_win,
            kills = EXCLUDED.kills,
            deaths = EXCLUDED.deaths,
            assists = EXCLUDED.assists
      RETURNING *;
    `;

    const values = [
      match_id,
      hero_id,
      role || null,
      booster_ruiner || null,
      radiant_win ?? null,
      kills ?? null,
      deaths ?? null,
      assists ?? null
    ];

    const result = await pool.query(query, values);
    res.json({ message: "Match saved successfully!", match: result.rows[0] });
  } catch (err) {
    console.error("Error saving match:", err);
    res.status(500).json({ error: "Failed to save match" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
