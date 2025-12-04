const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const app = express();

// Видаємо всі статичні файли з public/
app.use(express.static(path.join(__dirname, "public")));

// API endpoint для останніх матчів (твій гравець)
app.get("/api/matches", async (req, res) => {
  try {
    const response = await fetch("https://api.opendota.com/api/players/863386335/recentMatches");
    const matches = await response.json();
    res.json(matches); // віддаємо масив напряму
  } catch (err) {
    res.status(500).json({ error: "Не вдалося отримати дані з OpenDota" });
  }
});

// API endpoint для конкретного матчу (10 гравців)
app.get("/api/match/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
    const matchData = await response.json();
    res.json(matchData); // віддаємо весь JSON матчу
  } catch (err) {
    res.status(500).json({ error: "Не вдалося отримати дані матчу" });
  }
});

// Головна сторінка
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game1.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
