const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Підключення до Render Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// API: останні матчі з OpenDota
app.get("/api/matches", async (req, res) => {
  try {
    const response = await fetch("https://api.opendota.com/api/players/863386335/recentMatches");
    const matches = await response.json();
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Не вдалося отримати дані з OpenDota" });
  }
});

// API: конкретний матч
app.get("/api/match/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
    const matchData = await response.json();
    res.json(matchData);
  } catch (err) {
    res.status(500).json({ error: "Не вдалося отримати дані матчу" });
  }
});

// API: збереження матчу у базу
app.post("/api/saveMatch", async (req, res) => {
  const { matchId, selections, start_time, duration, radiant_win, lobby_type, game_mode, cluster, radiant_score } = req.body;

  try {
    await pool.query(
      `INSERT INTO matches (match_id, start_time, duration, radiant_win, lobby_type, game_mode, cluster, radiant_score)
       VALUES ($1, to_timestamp($2), $3, $4, $5, $6, $7, $8)
       ON CONFLICT (match_id) DO NOTHING`,
      [matchId, start_time, duration, radiant_win, lobby_type, game_mode, cluster, radiant_score]
    );

    for (const sel of selections) {
      await pool.query(
        `INSERT INTO match_players (match_id, hero_id, role, status, is_mine)
         VALUES ($1, $2, $3, $4, $5)`,
        [matchId, sel.hero_id, sel.role, sel.status, sel.isMine]
      );
    }

    res.json({ success: true, message: `Матч ${matchId} збережено у базі` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка збереження у базу" });
  }
});

// API: предікт
app.get("/api/predict", async (req, res) => {
  try {
    const result = await pool.query("SELECT role, status FROM match_players");
    const rows = result.rows;

    if (rows.length === 0) {
      return res.json({ message: "Немає даних для предікту" });
    }

    const roleStats = {};
    let totalStatus = 0;
    let totalCount = 0;

    rows.forEach(r => {
      if (!roleStats[r.role]) {
        roleStats[r.role] = { count: 0, totalStatus: 0 };
      }
      roleStats[r.role].count++;
      roleStats[r.role].totalStatus += parseInt(r.status);

      totalStatus += parseInt(r.status);
      totalCount++;
    });

    const predictions = Object.entries(roleStats).map(([role, stats]) => {
      const avgStatus = stats.totalStatus / stats.count;
      return { role, avgStatus };
    });

    const bestRole = predictions.reduce((a, b) => a.avgStatus > b.avgStatus ? a : b);
    const avgStatusAll = totalStatus / totalCount;
    const winChance = (avgStatusAll / 10 * 100).toFixed(1);

    res.json({
      message: "Предікт на наступний матч",
      bestRole: bestRole.role,
      avgStatus: bestRole.avgStatus.toFixed(2),
      winChance: `${winChance}%`,
      allRoles: predictions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка предікта" });
  }
});

// Головна сторінка
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game1.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
