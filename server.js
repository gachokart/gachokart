const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Utility: OpenDota Player ID (replace with your own if needed)
const MY_ACCOUNT_ID = 863386335;

// API: отримати гравців збереженого матчу
app.get("/api/savedMatchPlayers/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const result = await pool.query(
      "SELECT hero_id, role, status, is_mine FROM match_players WHERE match_id = $1",
      [matchId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Saved match players error:", err);
    res.status(500).json({ error: "Не вдалося отримати гравців матчу" });
  }
});

// API: збережені матчі з Postgres
app.get("/api/savedMatches", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM matches ORDER BY start_time DESC "
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Saved matches error:", err);
    res.status(500).json({ error: "Не вдалося отримати збережені матчі" });
  }
});

// API: recent matches for quick list
app.get("/api/matches", async (req, res) => {
  try {
    const response = await fetch(`https://api.opendota.com/api/players/${MY_ACCOUNT_ID}/recentMatches`);
    const matches = await response.json();
    res.json(matches);
  } catch (err) {
    console.error("Recent matches error:", err);
    res.status(500).json({ error: "Не вдалося отримати дані з OpenDota" });
  }
});

// API: full match details
app.get("/api/match/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
    const matchData = await response.json();
    res.json(matchData);
  } catch (err) {
    console.error("Match fetch error:", err);
    res.status(500).json({ error: "Не вдалося отримати дані матчу" });
  }
});

// API: save match to DB (matches + match_players, no duplicates)
app.post("/api/saveMatch", async (req, res) => {
  const {
    matchId,
    selections,
    start_time,
    duration,
    radiant_win,
    lobby_type,
    game_mode,
    cluster,
    radiant_score
  } = req.body;

  if (!matchId || !Array.isArray(selections) || selections.length === 0) {
    return res.status(400).json({ error: "Неповні дані: matchId або selections" });
  }

  try {
    // 1) Upsert match header
    await pool.query(
  `INSERT INTO matches (match_id, start_time, duration, radiant_win, lobby_type, game_mode, cluster, radiant_score)
   VALUES ($1, to_timestamp($2), $3, $4, $5, $6, $7, $8)
   ON CONFLICT (match_id) DO UPDATE
   SET start_time = EXCLUDED.start_time,
       duration = EXCLUDED.duration,
       radiant_win = EXCLUDED.radiant_win,
       lobby_type = EXCLUDED.lobby_type,
       game_mode = EXCLUDED.game_mode,
       cluster = EXCLUDED.cluster,
       radiant_score = EXCLUDED.radiant_score;`,   // ← додай крапку з комою всередині рядка
  [matchId, start_time, duration, radiant_win, lobby_type, game_mode, cluster, radiant_score]
);

    // 2) Clear existing players for this match to avoid duplicates
    await pool.query(`DELETE FROM match_players WHERE match_id = $1`, [matchId]);

    // 3) Insert players
    for (const sel of selections) {
      if (!sel.hero_id) continue; // guard
      await pool.query(
        `INSERT INTO match_players (match_id, hero_id, role, status, is_mine)
         VALUES ($1, $2, $3, $4, $5)`,
        [matchId, sel.hero_id, sel.role, sel.status, sel.isMine]
      );
    }

    res.json({ success: true, message: `Матч ${matchId} збережено у базі` });
  } catch (err) {
    console.error("Save match error:", err);
    res.status(500).json({ error: "Помилка збереження у базу" });
  }
});

// Basic predict demo
app.get("/api/predict", async (req, res) => {
  try {
    const result = await pool.query("SELECT role, status FROM match_players");
    const rows = result.rows;

    if (rows.length === 0) {
      return res.json({ message: "Немає даних для предікту" });
    }

    const roleStats = {};
    let totalStatus = 0;

    rows.forEach(r => {
      const role = r.role || "Unknown";
      const status = Number(r.status) || 0;
      if (!roleStats[role]) roleStats[role] = { count: 0, totalStatus: 0 };
      roleStats[role].count += 1;
      roleStats[role].totalStatus += status;
      totalStatus += status;
    });

    const predictions = Object.entries(roleStats).map(([role, stats]) => ({
      role,
      avgStatus: stats.totalStatus / stats.count
    }));

    const bestRole = predictions.reduce((a, b) => (a.avgStatus > b.avgStatus ? a : b));
    const avgStatusAll = totalStatus / rows.length;
    const winChance = (avgStatusAll / 10 * 100).toFixed(1);

    res.json({
      message: "Предікт на основі середнього статусу",
      bestRole: bestRole.role,
      avgStatus: Number(bestRole.avgStatus.toFixed(2)),
      winChancePercent: Number(winChance),
      roles: predictions
    });
  } catch (err) {
    console.error("Predict error:", err);
    res.status(500).json({ error: "Помилка предікта" });
  }
});

// Serve UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game1.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
