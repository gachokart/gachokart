import express from "express";
import fetch from "node-fetch";

const app = express();

// Проксі для історії матчів
app.get("/api/matches", async (req, res) => {
  const { account_id, count } = req.query;
  const url = `https://api.opendota.com/api/players/${account_id}/matches?limit=${count || 20}&project=lane_role&project=kills&project=deaths&project=assists&project=hero_id&project=duration&project=radiant_win&project=player_slot`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (err) {
    res.status(500).send("Fetch error: " + err.message);
  }
});

// Проксі для деталей матчу
app.get("/api/match/:id", async (req, res) => {
  const url = `https://api.opendota.com/api/matches/${req.params.id}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (err) {
    res.status(500).send("Fetch error: " + err.message);
  }
});

app.listen(3000, () => console.log("Proxy server running on http://localhost:3000"));
