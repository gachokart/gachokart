// server.js
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = 3000;

// Твій SteamID64
const STEAM_ID64 = "863386335";

app.use(express.static(path.join(__dirname)));

// Ендпоінт для прогнозу по Dota 2
app.get("/api/predict", async (req, res) => {
  try {
    // Беремо останні 20 матчів саме по Dota 2 (appid 570)
    const url = `https://api.opendota.com/api/players/${STEAM_ID64}/matches?limit=20&game_mode=all_pick&significant=0`;
    const response = await fetch(url);
    const matches = await response.json();

    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(500).json({ error: "Не вдалося отримати матчі" });
    }

    // Фільтруємо тільки Dota 2 (appid 570) — OpenDota і так дає тільки Dota, але залишимо для надійності
    const dotaMatches = matches.filter(m => m.game_mode !== undefined);

    const wins = dotaMatches.filter(m => m.radiant_win === (m.player_slot < 128)).length;
    const winrate = wins / dotaMatches.length;

    // Середні показники
    const avgKills = dotaMatches.reduce((s, m) => s + m.kills, 0) / dotaMatches.length;
    const avgDeaths = dotaMatches.reduce((s, m) => s + (m.deaths || 1), 0) / dotaMatches.length;
    const avgAssists = dotaMatches.reduce((s, m) => s + m.assists, 0) / dotaMatches.length;
    const avgGPM = dotaMatches.reduce((s, m) => s + m.gold_per_min, 0) / dotaMatches.length;
    const avgXPM = dotaMatches.reduce((s, m) => s + m.xp_per_min, 0) / dotaMatches.length;

    const kda = (avgKills + avgAssists) / avgDeaths;

    // Евристика для шансів
    let boosterMy = Math.min(0.5, (kda / 5 + avgGPM / 800 + avgXPM / 800) / 3);
    let ruinerMy  = Math.min(0.5, (1 / (kda + 0.5) + (300 / avgGPM) + (300 / avgXPM)) / 6);

    // Ворожа команда — умовно протилежні значення
    let boosterEn = 0.3 + (1 - boosterMy) * 0.4;
    let ruinerEn  = 0.2 + (1 - ruinerMy) * 0.3;

    res.json({
      winChance: (winrate * 100).toFixed(1),
      boosterMy: (boosterMy * 100).toFixed(1),
      ruinerMy: (ruinerMy * 100).toFixed(1),
      boosterEn: (boosterEn * 100).toFixed(1),
      ruinerEn: (ruinerEn * 100).toFixed(1),
      kda: kda.toFixed(2),
      gpm: avgGPM.toFixed(0),
      xpm: avgXPM.toFixed(0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка прогнозу" });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
