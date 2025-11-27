// Load all matches
async function loadMatches() {
  try {
    const res = await fetch("/api/matches");
    const data = await res.json();
    console.log("Matches:", data.matches);

    const list = document.getElementById("matches");
    list.innerHTML = "";
    data.matches.forEach(m => {
      const li = document.createElement("li");
      li.textContent = `Match ${m.match_id} | Hero: ${m.hero_id ?? "-"} | K/D/A: ${m.kills}/${m.deaths}/${m.assists}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading matches:", err);
  }
}

// Save one match
async function saveMatch(match) {
  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(match)
    });
    const data = await res.json();
    console.log("Saved:", data);
    loadMatches(); // reload list
  } catch (err) {
    console.error("Error saving match:", err);
  }
}

// Example usage: attach to button
document.getElementById("saveBtn").addEventListener("click", () => {
  const match = {
    match_id: Date.now(), // unique ID
    hero_id: 42,
    role: "Carry",
    booster_ruiner: "none",
    kills: 10,
    deaths: 2,
    assists: 8,
    radiant_win: true
  };
  saveMatch(match);
});

// Load matches on page start
window.addEventListener("DOMContentLoaded", loadMatches);
