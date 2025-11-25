const API_BASE = "https://gachokart.onrender.com"; // бекенд Render
const LS_KEY = "matches_cache_v1";

async function fetchMatches() {
  try {
    const res = await fetch(`${API_BASE}/matches`);
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
  localStorage.setItem(LS_KEY, JSON.stringify(matches));
  const res = await fetch(`${API_BASE}/api/matches`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(matches),
  });
  if (!res.ok) throw new Error("Save failed " + res.status);
  return res.json();
}
