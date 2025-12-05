let currentMatchId = null;
let currentSelections = [];

async function loadMatches() {
  const res = await fetch("/api/matches");
  const matches = await res.json();
  const container = document.getElementById("matches");
  container.innerHTML = "";

  matches.forEach(m => {
    const div = document.createElement("div");
    div.className = "match-item";
    div.innerHTML = `
      <span>Match ID: ${m.match_id}</span>
      <button onclick="openMatchForm(${m.match_id})">Вибрати ролі</button>
    `;
    container.appendChild(div);
  });
}

async function openMatchForm(matchId) {
  const res = await fetch(`/api/match/${matchId}`);
  const matchData = await res.json();

  currentMatchId = matchData.match_id;
  currentSelections = matchData.players.map(p => ({
    hero_id: p.hero_id,
    role: "Carry", // дефолт
    status: 0,
    isMine: p.account_id === 863386335
  }));

  const table = document.getElementById("playersTable");
  table.innerHTML = "";

  currentSelections.forEach((sel, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${sel.hero_id}</td>
      <td>
        <select onchange="updateRole(${idx}, this.value)">
          <option>Carry</option>
          <option>Mid</option>
          <option>Offlane</option>
          <option>Support</option>
          <option>Hard Support</option>
        </select>
      </td>
      <td>
        <input type="number" min="0" max="10" value="${sel.status}" onchange="updateStatus(${idx}, this.value)">
      </td>
      <td>
        <input type="checkbox" ${sel.isMine ? "checked" : ""} onchange="updateIsMine(${idx}, this.checked)">
      </td>
    `;
    table.appendChild(row);
  });

  document.getElementById("formTitle").innerText = `Матч ${matchId}`;
  document.getElementById("matchForm").style.display = "block";
}

function updateRole(idx, value) {
  currentSelections[idx].role = value;
}

function updateStatus(idx, value) {
  currentSelections[idx].status = parseInt(value);
}

function updateIsMine(idx, value) {
  currentSelections[idx].isMine = value;
}

async function submitMatch() {
  const payload = {
    matchId: currentMatchId,
    start_time: Math.floor(Date.now() / 1000),
    duration: 2500,
    radiant_win: true,
    lobby_type: 1,
    game_mode: 22,
    cluster: 123,
    radiant_score: 45,
    selections: currentSelections
  };

  const res = await fetch("/api/saveMatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  alert(result.message);
}

async function getPredict() {
  const res = await fetch("/api/predict");
  const data = await res.json();
  document.getElementById("predict").innerText = JSON.stringify(data, null, 2);
}
