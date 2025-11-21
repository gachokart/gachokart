const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

// Читаємо matches.json
app.get("/api/matches", (req, res) => {
  const data = fs.readFileSync("matches.json");
  res.json(JSON.parse(data));
});

// Додаємо новий матч з роллю та статусом
app.post("/api/matches", (req, res) => {
  const { match_id, hero_id, role, booster_ruiner } = req.body;

  const data = JSON.parse(fs.readFileSync("matches.json"));
  data.matches.push({
    match_id,
    hero_id,
    role,
    booster_ruiner,
    start_time: Date.now(),
    radiant_win: null,
    kills: 0,
    deaths: 0,
    assists: 0
  });

  fs.writeFileSync("matches.json", JSON.stringify(data, null, 2));
  res.json({ message: "Match added successfully!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
