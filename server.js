app.get("/api/predict", async (req, res) => {
  try {
    const url = `https://api.opendota.com/api/players/${STEAM_ID64}/recentMatches`;
    const response = await fetch(url);
    const matches = await response.json();

    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(500).json({ error: "Матчі не знайдено. Перевір, чи профіль відкритий." });
    }

    res.json({ sample: matches.slice(0, 3) }); // просто віддай перші 3 матчі
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка запиту до OpenDota" });
  }
});
