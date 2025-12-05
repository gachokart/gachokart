const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const app = express();

app.use(express.json()); // приймаємо JSON з фронтенду
app.use(express.static(path.join(__dirname, "public")));

let savedMatches = []; // тимчасове сховище у пам'яті

// API endpoint для останніх матчів
app.get("/api/matches", async (req, res) => {
  try {
    const response = await fetch("https://api.opendota.com/api/players/863386335/recentMatches");
    const matches = await response.json();
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Не вдалося отримати дані з OpenDota" });
  }
});

// API endpoint для конкретного матчу
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

// API endpoint для збереження виборів
app.post("/api/saveMatch", (req, res) => {
  const { matchId, selections } = req.body;
  savedMatches.push({ matchId, selections });
  console.log("Збережено:", matchId, selections);
  res.json({ success: true, message: `Матч ${matchId} збережено` });
});

// API для предікту
app.get("/api/predict", (req, res) => {
  if (savedMatches.length === 0) {
    return res.json({ message: "Немає даних для предікту" });
  }

  const roleStats = {};
  let totalStatus = 0;
  let totalCount = 0;

  savedMatches.forEach(match => {
    match.selections.forEach(sel => {
      if (!roleStats[sel.role]) {
        roleStats[sel.role] = { count: 0, totalStatus: 0 };
      }
      roleStats[sel.role].count++;
      roleStats[sel.role].totalStatus += parseInt(sel.status);

      totalStatus += parseInt(sel.status);
      totalCount++;
    });
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
});

// Головна сторінка
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game1.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
