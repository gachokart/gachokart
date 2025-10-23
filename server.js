import express from "express";
import fetch from "node-fetch";

const app = express();
const API_KEY = "F376439B1833C7DF76D6AB25A571755E"; // 🔑 сюди вставляєш свій Steam API key

// Проксі для історії матчів
app.get("/api/matches", async (req, res) => {
  const { account_id, count } = req.query;
  const url = `https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1/?key=${API_KEY}&account_id=${863386304}&matches_requested=${count || 20}`;
  const response = await fetch(url);
  const data = await response.json();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(data);
});

// Проксі для деталей матчу
app.get("/api/match/:id", async (req, res) => {
  const url = `https://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1/?key=${API_KEY}&match_id=${req.params.id}`;
  const response = await fetch(url);
  const data = await response.json();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(data);
});

app.listen(3000, () => console.log("Proxy server running on http://localhost:3000"));
