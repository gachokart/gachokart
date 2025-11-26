const API_BASE = "https://gachokart.onrender.com"; // бекенд Render
const LS_KEY = "matches_cache_v1";

async function fetchMatches() {
  try {
    const res = await fetch(`${API_BASE}/api/matches`);
    if (!res.ok) throw new Error("Server error " + res.status);
    const data = await res.json();
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    return data;
  } catch {
    const cached = localStorage.getItem(LS_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

async function saveMatches(matches) {
  // matches може бути масивом або одним об’єктом
  localStorage.setItem(LS_KEY, JSON.stringify(matches));
  const res = await fetch(`${API_BASE}/api/matches`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(matches),
  });
  if (!res.ok) throw new Error("Save failed " + res.status);
  return res.json();
}

// 🔎 Тестовий виклик
(async () => {
  try {
    const response = await saveMatches([
      {
        match_id: 1234567890,   // 👈 обов’язково
        radiant_win: true,
        hero_id: 1,
        role: "carry",
        booster_ruiner: "none",
        kills: 10,
        deaths: 2,
        assists: 5
      }
    ]);
    console.log("Saved:", response);
  } catch (e) {
    console.error(e);
  }
})();
