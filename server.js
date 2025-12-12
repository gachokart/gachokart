import express from "express";
import bodyParser from "body-parser";
import { Pool } from "pg";
import path from "path";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/dota",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// === Збереження матчу ===
app.post("/api/saveMatch", async (req, res) => {
  try {
    const { matchId, players } = req.body;
    console.log("Saving match:", matchId);
    console.log("Players:", players);

    await pool.query(
      `INSERT INTO matches (match_id, start_time, duration, radiant_win, lobby_type, game_mode, cluster, radiant_score)
       VALUES ($1, NOW(), 0, false, 0, 0, 0, 0)
       ON CONFLICT (match_id) DO NOTHING;`,
      [matchId]
    );

    for (const p of players) {
      await pool.query(
        `INSERT INTO match_players (match_id, hero_id, role, status, is_mine, player_slot)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (match_id, hero_id) DO UPDATE
         SET role = EXCLUDED.role,
             status = EXCLUDED.status,
             is_mine = EXCLUDED.is_mine,
             player_slot = EXCLUDED.player_slot;`,
        [matchId, p.hero_id, p.role, p.status, p.is_mine, p.player_slot]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("saveMatch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// === Отримати список матчів ===
app.get("/api/savedMatches", async (req, res) => {
  const result = await pool.query("SELECT * FROM matches ORDER BY start_time DESC");
  res.json(result.rows);
});

// === Отримати гравців конкретного матчу ===
app.get("/api/savedMatchPlayers/:id", async (req, res) => {
  const matchId = req.params.id;
  const result = await pool.query(
    "SELECT * FROM match_players WHERE match_id = $1 ORDER BY player_slot ASC",
    [matchId]
  );
  res.json(result.rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
