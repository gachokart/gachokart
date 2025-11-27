// API: отримати матчі з гравцями та героями
app.get("/api/matches", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.match_id,
             m.start_time,
             m.duration,
             m.radiant_win,
             p.account_id,
             p.player_slot,
             p.is_radiant,
             p.hero_id,
             h.hero_name,
             p.role,
             p.booster_ruiner,
             p.kills,
             p.deaths,
             p.assists
      FROM matches m
      LEFT JOIN players p ON m.match_id = p.match_id
      LEFT JOIN heroes h ON p.hero_id = h.hero_id
      ORDER BY m.start_time DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error in /api/matches:", err);
    res.status(500).json({ error: err.message });
  }
});
