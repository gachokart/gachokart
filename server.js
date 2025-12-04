const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const app = express();

// Видаємо всі статичні файли з public/
app.use(express.static(path.join(__dirname, "public")));

// API endpoint для матчів з OpenDota
app.get("/api/matches", async (req, res) => {
  try {
    const response = await fetch("https://api.opendota.com/api/players/863386335/recentMatches");
    const matches = await response.json();
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: "Не вдалося отримати дані з OpenDota", details: err.message });
  }
});

// Головна сторінка
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game1.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
