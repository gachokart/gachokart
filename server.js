// server.js
const express = require("express");
const cors = require("cors");

// універсальний fetch: працює і в Node 16, і в Node 18+
let fetchFn;
try {
  // якщо глобальний fetch існує (Node 18+)
  if (typeof fetch !== "undefined") {
    fetchFn = fetch;
  } else {
    // якщо ні — підключаємо node-fetch
    fetchFn = (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args));
  }
} catch (e) {
  // fallback
  fetchFn = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));
}

const app = express();
app.use(cors());

app.get("/api/matches", async (req, res) => {
  try {
    const { account_id, count } = req.query;
    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    // формуємо URL з потрібними полями
    const url =
      `https://api.opendota.com/api/players/${account_id}/matches?limit=${count || 20}` +
      `&project=match_id&project=kills&project=deaths&project=assists` +
      `&project=hero_id&project=duration&project=radiant_win&project=player_slot` +
      `&project=lane_role`;

    const response = await fetchFn(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching matches:", err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
