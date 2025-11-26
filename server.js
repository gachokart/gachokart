const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(cors());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL connection from Render Environment Variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Home -> game1.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game1.html"));
});

/**
 * API endpoints
 */

// List all matches
app.get("/api/matches", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM matches ORDER BY start_time DESC NULLS LAST, id DESC"
    );
    res.json({ matches: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk insert/update matches via PUT
app.put("/api/matches", async (req, res) => {
  try {
    const matches = Array.isArray(req.body) ? req.body : [req.body];

    for (const m of matches) {
      if (!m.match_id) {
        return res.status(400).json({ error: "match_id is required" });
      }

      await pool.query(
        `INSERT INTO matches (match_id, start_time, radiant_win, raw)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (match_id) DO UPDATE SET
           start_time = EXCLUDED.start_time,
           radiant_win = EXCLUDED.radiant_win`,
        [m.match_id, Date.now(), m.radiant_win ?? null, null]
      );

      if (m.hero_id) {
        await pool.query(
          `INSERT INTO players (match_id, player_slot, hero_id, role, booster_ruiner, kills, deaths, assists)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            m.match_id,
            0,
            m.hero_id,
            m.role ?? null,
            m.booster_ruiner ?? null,
            m.kills ?? 0,
            m.deaths ?? 0,
            m.assists ?? 0
          ]
        );
      }
    }

    res.json({ ok: true, count: matches.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Basic not-found handler for API
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  next();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
