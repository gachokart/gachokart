const API_BASE = "https://gachokart.onrender.com";

// Завантажити всі матчі
async function loadMatches() {
  try {
    const res = await fetch(`${API_BASE}/api/matches`);
    const matches = await res.json();
    renderMatches(matches);
  } catch (err) {
    console.error("Error loading matches:", err);
  }
}

// Відобразити матчі з селекторами
function renderMatches(matches) {
  const container = document.getElementById("matches");
  container.innerHTML = "";

  matches.forEach(m => {
    const div = document.createElement("div");
    div.className = "match-row";

    div.innerHTML = `
      <span>
        Match ${m.match_id} | Hero ${m.hero_id} | ${m.kills || 0}/${m.deaths || 0}/${m.assists || 0} |
        ${m.radiant_win ? "Win" : "Loss"} | Duration ${m.duration || 0}
      </span>
      <select id="role-${m.match_id}">
        <option value="">--Role--</option>
        <option value="carry" ${m.role==="carry"?"selected":""}>Carry</option>
        <option value="mid" ${m.role==="mid"?"selected":""}>Mid</option>
        <option value="offlane" ${m.role==="offlane"?"selected":""}>Offlane</option>
        <option value="support" ${m.role==="support"?"selected":""}>Support</option>
        <option value="hard support" ${m.role==="hard support"?"selected":""}>Hard Support</option>
      </select>
      <select id="booster-${m.match_id}">
        <option value="">--Booster/Ruiner--</option>
        <option value="booster" ${m.booster_ruiner==="booster"?"selected":""}>Booster</option>
        <option value="ruiner" ${m.booster_ruiner==="ruiner"?"selected":""}>Ruiner</option>
        <option value="none" ${m.booster_ruiner==="none"?"selected":""}>None</option>
      </select>
      <button onclick="saveAnnotations(${m.match_id}, ${m.hero_id})">Save</button>
    `;
    container.appendChild(div);
  });
}

// Зберегти вибір у базу
async function saveAnnotations(match_id, hero_id) {
  const role = document.getElementById(`role-${match_id}`).value;
  const booster_ruiner = document.getElementById(`booster-${match_id}`).value;

  try {
    const res = await fetch(`${API_BASE}/api/matches`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        match_id,
        hero_id,
        role,
        booster_ruiner
      })
    });
    const data = await res.json();
    console.log("Saved:", data);
    loadMatches(); // оновити список після збереження
  } catch (err) {
    console.error("Error saving annotations:", err);
  }
}

// При старті сторінки
window.onload = loadMatches;
