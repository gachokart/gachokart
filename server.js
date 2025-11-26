const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(cors());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL connection from Render Environment Variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Home -> game1.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game1.html"));
});

/**
 * API endpoints
 */

// List all matches
app.get("/api/matches", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM matches ORDER BY start_time DESC NULLS LAST, id DESC");
    res.json({ matches: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Insert a minimal match manually
app.post("/api/matches", async (req, res) => {
  try {
    const { match_id, hero_id, role, booster_ruiner, radiant_win, kills, deaths, assists } = req.body;

    // Upsert match (minimal fields)
    await pool.query(
      `INSERT INTO matches (match_id, start_time, radiant_win, raw)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (match_id) DO UPDATE SET
         start_time = EXCLUDED.start_time,
         radiant_win = EXCLUDED.radiant_win`,
      [match_id, Date.now(), radiant_win ?? null, null]
    );

    // Optional: insert a single player row tied to this match
    if (hero_id) {
      await pool.query(
        `INSERT INTO players (match_id, player_slot, hero_id, role, booster_ruiner, kills, deaths, assists)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [match_id, 0, hero_id, role ?? null, booster_ruiner ?? null, kills ?? 0, deaths ?? 0, assists ?? 0]
      );
    }

    res.json({ message: "Match stored", match_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Import a match from OpenDota and store match + players
app.post("/api/import/opendota/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const r = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
    const m = await r.json();

    // Store match
    await pool.query(
      `INSERT INTO matches (match_id, start_time, duration, radiant_win, lobby_type, game_mode, cluster, radiant_score, dire_score, raw)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (match_id) DO UPDATE SET
         start_time = EXCLUDED.start_time,
         duration = EXCLUDED.duration,
         radiant_win = EXCLUDED.radiant_win,
         lobby_type = EXCLUDED.lobby_type,
         game_mode = EXCLUDED.game_mode,
         cluster = EXCLUDED.cluster,
         radiant_score = EXCLUDED.radiant_score,
         dire_score = EXCLUDED.dire_score,
         raw = EXCLUDED.raw`,
      [
        m.match_id,
        m.start_time ?? null,
        m.duration ?? null,
        m.radiant_win ?? null,
        m.lobby_type ?? null,
        m.game_mode ?? null,
        m.cluster ?? null,
        m.radiant_score ?? null,
        m.dire_score ?? null,
        m // raw JSON
      ]
    );

    // Store players
    for (const p of m.players || []) {
      await pool.query(
        `INSERT INTO players (match_id, account_id, player_slot, hero_id, lane, lane_role, role, booster_ruiner,
                              kills, deaths, assists, last_hits, denies, gold, gold_spent, gpm, xpm, net_worth,
                              hero_damage, tower_damage, hero_healing, obs_placed, sen_placed, items, abilities,
                              lh_t, xp_t, gold_t, rank_tier, raw)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
                 $9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
                 $19,$20,$21,$22,$23,$24,$25,
                 $26,$27,$28,$29,$30)
         ON CONFLICT DO NOTHING`,
        [
          m.match_id,
          p.account_id ?? null,
          p.player_slot,
          p.hero_id,
          p.lane ?? null,
          p.lane_role ?? null,
          null, // your manual role
          null, // your booster/ruiner tag
          p.kills ?? null,
          p.deaths ?? null,
          p.assists ?? null,
          p.last_hits ?? null,
          p.denies ?? null,
          p.gold ?? null,
          p.gold_spent ?? null,
          p.gpm ?? null,
          p.xpm ?? null,
          p.net_worth ?? null,
          p.hero_damage ?? null,
          p.tower_damage ?? null,
          p.hero_healing ?? null,
          p.obs_placed ?? null,
          p.sen_placed ?? null,
          JSON.stringify({
            items: [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5],
            purchases: p.purchase_log
          }),
          JSON.stringify({
            ability_uses: p.ability_uses,
            ability_upgrades: p.ability_upgrades
          }),
          JSON.stringify(p.lh_t ?? null),
          JSON.stringify(p.xp_t ?? null),
          JSON.stringify(p.gold_t ?? null),
          p.rank_tier ?? null,
          JSON.stringify(p)
        ]
      );
    }

    res.json({ ok: true, match_id: m.match_id, players: (m.players || []).length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Basic not-found handler for API
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  next();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
