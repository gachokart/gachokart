const MY_ACCOUNT_ID = 863386335;

let currentMatchId = null;
let currentSelections = [];
let currentMeta = null;
let heroMap = {};

async function loadHeroes() {
  const res = await fetch("https://api.opendota.com/api/heroes");
  const heroes = await res.json();
  heroes.forEach(h => {
    const shortName = h.name.replace("npc_dota_hero_", "");
    heroMap[h.id] = {
      name: h.localized_name,
      icon: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${shortName}_full.png`
    };
  });
}

window.onload = () => {
  loadHeroes();
};



function byId(id) {
  return document.getElementById(id);
}

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

async function loadMatches() {
  const container = byId("matches");
  container.innerHTML = "<div class='info'>Завантаження...</div>";
  try {
    const res = await fetch("/api/matches");
    const matches = await res.json();

    if (!Array.isArray(matches) || matches.length === 0) {
      container.innerHTML = "<div class='info'>Матчі не знайдені</div>";
      return;
    }

    container.innerHTML = "";
    // Show latest 10
    matches.slice(0, 10).forEach(m => {
      const item = document.createElement("div");
      item.className = "match-item";
      item.innerHTML = `
        <div class="match-row">
          <div>
            <strong>${m.match_id}</strong>
            <span class="muted"> | K:${m.kills ?? 0} D:${m.deaths ?? 0} A:${m.assists ?? 0}</span>
          </div>
          <div>
            <button class="btn small" onclick="openMatchForm(${m.match_id})">Вибрати ролі</button>
          </div>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error("loadMatches error:", err);
    container.innerHTML = "<div class='error'>Помилка завантаження матчів</div>";
  }
}




async function loadSavedMatches() {
  const container = byId("matches");
  container.innerHTML = "<div class='info'>Завантаження збережених...</div>";
  try {
    const res = await fetch("/api/savedMatches");
    const matches = await res.json();

    if (!Array.isArray(matches) || matches.length === 0) {
      container.innerHTML = "<div class='info'>Немає збережених матчів</div>";
      return;
    }

    container.innerHTML = "";
    matches.forEach(m => {
  const item = document.createElement("div");
  item.className = "match-item";
  item.innerHTML = `
    <div class="match-row">
      <div>
        <strong>${m.match_id}</strong>
        <span class="muted"> | Duration: ${m.duration}s | Radiant win: ${m.radiant_win}</span>
      </div>
      <div>
        <button class="btn small" onclick="openSavedMatch(${m.match_id})">Переглянути</button>
      </div>
    </div>
  `;
  container.appendChild(item);
});
  } catch (err) {
    console.error("loadSavedMatches error:", err);
    container.innerHTML = "<div class='error'>Помилка завантаження збережених матчів</div>";
  }
}

async function openSavedMatch(matchId) {
  try {
    const res = await fetch(`/api/savedMatchPlayers/${matchId}`);
    const players = await res.json();

    const table = document.getElementById("playersTable");
    table.innerHTML = "";

    players.forEach(p => {
      const heroName = heroMap[p.hero_id] || p.hero_id; // якщо нема в мапі, показує id
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${heroName}</td>
        <td><span class="role-tag">${p.role}</span></td>
        <td>${p.status}</td>
        <td>${p.is_mine ? "✅" : ""}</td>
      `;
      table.appendChild(row);
    });

    document.getElementById("formTitle").innerText = `Збережений матч ${matchId}`;
    document.getElementById("matchForm").style.display = "block";
  } catch (err) {
    console.error("openSavedMatch error:", err);
    alert("Не вдалося відкрити збережений матч");
  }
}
async function openMatchForm(matchId) {
  try {
    const res = await fetch(`/api/match/${matchId}`);
    const matchData = await res.json();

    currentMatchId = matchData.match_id;
    currentMeta = {
      start_time: matchData.start_time,
      duration: matchData.duration,
      radiant_win: matchData.radiant_win,
      lobby_type: matchData.lobby_type,
      game_mode: matchData.game_mode,
      cluster: matchData.cluster,
      radiant_score: matchData.radiant_score
    };

    // Default selections (user can change)
    currentSelections = matchData.players.map(p => ({
      hero_id: p.hero_id,
      role: "Support",
      status: 0,
      isMine: p.account_id === MY_ACCOUNT_ID
    }));

    // Fill meta panel
    byId("formTitle").innerText = `Матч ${currentMatchId}`;
    byId("metaMatchId").innerText = currentMatchId;
    byId("metaRadiantWin").innerText = String(currentMeta.radiant_win);
    byId("metaDuration").innerText = String(currentMeta.duration);
    byId("metaGameMode").innerText = String(currentMeta.game_mode);

    // Render table
    const table = byId("playersTable");
    table.innerHTML = "";

    currentSelections.forEach((sel, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sel.hero_id}</td>
        <td>
          <select class="select" onchange="updateRole(${idx}, this.value)">
            <option value="Carry" ${sel.role === "Carry" ? "selected" : ""}>Carry</option>
            <option value="Mid" ${sel.role === "Mid" ? "selected" : ""}>Mid</option>
            <option value="Offlane" ${sel.role === "Offlane" ? "selected" : ""}>Offlane</option>
            <option value="Support" ${sel.role === "Support" ? "selected" : ""}>Support</option>
            <option value="Hard Support" ${sel.role === "Hard Support" ? "selected" : ""}>Hard Support</option>
          </select>
        </td>
        <td>
          <input class="input" type="number" min="0" max="10" value="${sel.status}" onchange="updateStatus(${idx}, this.value)" />
        </td>
        <td>
          <input type="checkbox" ${sel.isMine ? "checked" : ""} onchange="updateIsMine(${idx}, this.checked)" />
        </td>
      `;
      table.appendChild(row);
    });

    show(byId("matchForm"));
  } catch (err) {
    console.error("openMatchForm error:", err);
    alert("Не вдалося відкрити матч");
  }
}

function updateRole(idx, value) {
  currentSelections[idx].role = value;
}

function updateStatus(idx, value) {
  const v = Number(value);
  currentSelections[idx].status = isNaN(v) ? 0 : Math.max(0, Math.min(10, v));
}

function updateIsMine(idx, value) {
  currentSelections[idx].isMine = Boolean(value);
}

function cancelForm() {
  hide(byId("matchForm"));
  currentMatchId = null;
  currentSelections = [];
  currentMeta = null;
}

async function submitMatch() {
  if (!currentMatchId || currentSelections.length === 0) {
    alert("Нічого зберігати: немає матчу або гравців");
    return;
  }

  // Validate at least 1 selection has a role/status
  const invalid = currentSelections.some(sel => !sel.role || sel.status === null || sel.status === undefined);
  if (invalid) {
    alert("Будь ласка, заповни роль і статус для кожного героя");
    return;
  }

  const payload = {
    matchId: currentMatchId,
    start_time: currentMeta.start_time || Math.floor(Date.now() / 1000), // prefer real match start_time
    duration: currentMeta.duration || 0,
    radiant_win: Boolean(currentMeta.radiant_win),
    lobby_type: currentMeta.lobby_type || 0,
    game_mode: currentMeta.game_mode || 0,
    cluster: currentMeta.cluster || 0,
    radiant_score: currentMeta.radiant_score || 0,
    selections: currentSelections
  };

  try {
    const res = await fetch("/api/saveMatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.error) {
      alert("Помилка: " + result.error);
      return;
    }
    alert(result.message || "Збережено");
    cancelForm();
  } catch (err) {
    console.error("submitMatch error:", err);
    alert("Не вдалося зберегти матч");
  }
}

async function getPredict() {
  const pre = byId("predict");
  pre.textContent = "Завантаження...";
  try {
    const res = await fetch("/api/predict");
    const data = await res.json();
    pre.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("getPredict error:", err);
    pre.textContent = "Помилка отримання предікта";
  }
}
