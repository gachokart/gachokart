const MY_ACCOUNT_ID = 863386335;

let currentMatchId = null;
let currentSelections = [];
let currentMeta = null;

// Hero map: id -> { name, icon }
let heroMap = {};

async function loadHeroes() {
  try {
    const res = await fetch("https://api.opendota.com/api/heroes");
    const heroes = await res.json();
    heroes.forEach(h => {
      const shortName = h.name.replace("npc_dota_hero_", "");
      heroMap[h.id] = {
        name: h.localized_name,
        icon: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${shortName}_full.png`
      };
    });
    console.log("Hero map loaded:", heroMap);
  } catch (err) {
    console.error("loadHeroes error:", err);
  }
}

window.onload = () => {
  loadHeroes();
};

function byId(id) { return document.getElementById(id); }
function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

// ------------ OpenDota recent matches (editable form) ------------
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
  try {
    const res = await fetch("/api/savedMatches");
    const matches = await res.json();

    const list = document.getElementById("savedMatchesList");
    list.innerHTML = "";

    matches.forEach(m => {
      const li = document.createElement("li");
      li.textContent = `Матч ${m.match_id} — ${m.radiant_win ? "Radiant" : "Dire"} — ${Math.floor(m.duration/60)} хв`;
      li.onclick = () => openSavedMatch(m.match_id); // відкриває форму тільки при кліку
      list.appendChild(li);
    });
  } catch (err) {
    console.error("loadSavedMatches error:", err);
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

    currentSelections = matchData.players.map(p => ({
      hero_id: p.hero_id,
      role: "Support",
      status: (p.kills + p.assists - p.deaths), // проста оцінка замість 0
      is_mine: p.account_id === MY_ACCOUNT_ID
    }));

    const table = byId("playersTable");
    table.innerHTML = "";

    // заповнюємо мета-блок
    byId("formTitle").innerText = `Матч ${currentMatchId}`;
    byId("metaMatchId").innerText = matchData.match_id || "—";
    byId("metaRadiantWin").innerText = matchData.radiant_win ? "Radiant переміг" : "Dire переміг";
    byId("metaDuration").innerText = matchData.duration ? `${Math.floor(matchData.duration/60)} хв` : "—";

    if (matchData.start_time) {
      const date = new Date(matchData.start_time * 1000);
      byId("metaGameMode").innerText = date.toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } else {
      byId("metaGameMode").innerText = "—";
    }

    // визначаємо мою команду через індекс у масиві (Radiant перші 5, Dire другі 5)
    const myIndex = matchData.players.findIndex(p => p.account_id === MY_ACCOUNT_ID);
    let myTeam, enemyTeam;
    if (myIndex < 5) {
      myTeam = currentSelections.slice(0, 5);
      enemyTeam = currentSelections.slice(5, 10);
    } else {
      myTeam = currentSelections.slice(5, 10);
      enemyTeam = currentSelections.slice(0, 5);
    }

    // малюємо мою команду
    const myHeader = document.createElement("tr");
    myHeader.innerHTML = `<td colspan="4" class="team-header my-team">Моя команда (${myTeam.length})</td>`;
    table.appendChild(myHeader);

    myTeam.forEach((sel, idx) => {
      const hero = heroMap[sel.hero_id];
      const heroName = hero ? hero.name : sel.hero_id;
      const heroIcon = hero ? hero.icon : "";
      const row = document.createElement("tr");
      row.className = "my-team-row";
      row.innerHTML = `
        <td>${heroIcon ? `<img src="${heroIcon}" class="hero-icon">` : ""} ${heroName}</td>
        <td><select onchange="updateRole(${idx}, this.value)">
          <option value="Carry">Carry</option>
          <option value="Mid">Mid</option>
          <option value="Offlane">Offlane</option>
          <option value="Support" ${sel.role==="Support"?"selected":""}>Support</option>
          <option value="Hard Support">Hard Support</option>
        </select></td>
        <td><input type="number" min="0" max="10" value="${sel.status}" onchange="updateStatus(${idx}, this.value)"></td>
        <td><input type="checkbox" ${sel.isMine ? "checked" : ""} onchange="updateIsMine(${idx}, this.checked)"></td>
      `;
      table.appendChild(row);
    });

    // малюємо суперників
    const enemyHeader = document.createElement("tr");
    enemyHeader.innerHTML = `<td colspan="4" class="team-header enemy-team">Суперники (${enemyTeam.length})</td>`;
    table.appendChild(enemyHeader);

    enemyTeam.forEach((sel, idx) => {
      const hero = heroMap[sel.hero_id];
      const heroName = hero ? hero.name : sel.hero_id;
      const heroIcon = hero ? hero.icon : "";
      const row = document.createElement("tr");
      row.className = "enemy-team-row";
      row.innerHTML = `
        <td>${heroIcon ? `<img src="${heroIcon}" class="hero-icon">` : ""} ${heroName}</td>
        <td><select onchange="updateRole(${idx}, this.value)">
          <option value="Carry">Carry</option>
          <option value="Mid">Mid</option>
          <option value="Offlane">Offlane</option>
          <option value="Support" ${sel.role==="Support"?"selected":""}>Support</option>
          <option value="Hard Support">Hard Support</option>
        </select></td>
        <td><input type="number" min="0" max="10" value="${sel.status}" onchange="updateStatus(${idx}, this.value)"></td>
        <td><input type="checkbox" ${sel.isMine ? "checked" : ""} onchange="updateIsMine(${idx}, this.checked)"></td>
      `;
      table.appendChild(row);
    });

    show(byId("matchForm"));
  } catch (err) {
    console.error("openMatchForm error:", err);
    alert("Не вдалося відкрити матч");
  }
}


function updateRole(idx, value) { currentSelections[idx].role = value; }
function updateStatus(idx, value) {
  const v = Number(value);
  currentSelections[idx].status = isNaN(v) ? 0 : Math.max(0, Math.min(10, v));
}
function updateIsMine(idx, value) { currentSelections[idx].isMine = Boolean(value); }

function cancelForm() {
  hide(byId("matchForm"));
  currentMatchId = null;
  currentSelections = [];
  currentMeta = null;
}

async function submitMatch() {
  try {
    const matchId = byId("metaMatchId").innerText;

    const rows = document.querySelectorAll("#playersTable tr");
    const players = [];

    rows.forEach((row, idx) => {
      const heroId = row.dataset.heroId;
      const role = row.querySelector(".role-select")?.value || "";
      const status = parseInt(row.querySelector(".status-input")?.value || "0", 10);
      const isMine = row.querySelector(".is-mine-checkbox")?.checked || false;

      // визначаємо сторону: перші 5 — Radiant, другі 5 — Dire
      const player_slot = idx < 5 ? idx : idx + 128;

players.push({
  hero_id: heroId,
  role,
  status,
  is_mine: isMine,
  player_slot
});
    });

    const res = await fetch("/api/saveMatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, players })
    });

    if (!res.ok) throw new Error("Помилка збереження матчу");
    alert("Матч успішно збережено!");
    cancelForm();
  } catch (err) {
    console.error("submitMatch error:", err);
    alert("Не вдалося зберегти матч");
  }
}



async function openSavedMatch(matchId) {
  try {
    const res = await fetch(`/api/savedMatchPlayers/${matchId}`);
    const players = await res.json();

    const metaRes = await fetch(`/api/savedMatches`);
    const allMatches = await metaRes.json();
    const matchMeta = allMatches.find(m => m.match_id == matchId);

    const table = byId("playersTable");
    table.innerHTML = "";

    // визначаємо мою сторону
    const myPlayer = players.find(p => p.is_mine);
    const mySideRadiant = myPlayer.player_slot < 128;

    const myTeam = players.filter(p => mySideRadiant ? p.player_slot < 128 : p.player_slot >= 128);
    const enemyTeam = players.filter(p => mySideRadiant ? p.player_slot >= 128 : p.player_slot < 128);

    const myHeader = document.createElement("tr");
    myHeader.innerHTML = `<td colspan="4" class="team-header my-team">Моя команда (${myTeam.length})</td>`;
    table.appendChild(myHeader);

    myTeam.forEach(p => {
      const hero = heroMap[p.hero_id];
      const heroName = hero ? hero.name : p.hero_id;
      const heroIcon = hero ? hero.icon : "";
      const row = document.createElement("tr");
      row.className = "my-team-row";
      row.innerHTML = `
        <td>${heroIcon ? `<img src="${heroIcon}" class="hero-icon">` : ""} ${heroName}</td>
        <td>${roleTagHtml(p.role)}</td>
        <td>${p.status}</td>
        <td>${p.is_mine ? "✅" : ""}</td>
      `;
      table.appendChild(row);
    });

    const enemyHeader = document.createElement("tr");
    enemyHeader.innerHTML = `<td colspan="4" class="team-header enemy-team">Суперники (${enemyTeam.length})</td>`;
    table.appendChild(enemyHeader);

    enemyTeam.forEach(p => {
      const hero = heroMap[p.hero_id];
      const heroName = hero ? hero.name : p.hero_id;
      const heroIcon = hero ? hero.icon : "";
      const row = document.createElement("tr");
      row.className = "enemy-team-row";
      row.innerHTML = `
        <td>${heroIcon ? `<img src="${heroIcon}" class="hero-icon">` : ""} ${heroName}</td>
        <td>${roleTagHtml(p.role)}</td>
        <td>${p.status}</td>
        <td>${p.is_mine ? "✅" : ""}</td>
      `;
      table.appendChild(row);
    });

    show(byId("matchForm"));
  } catch (err) {
    console.error("openSavedMatch error:", err);
    alert("Не вдалося відкрити збережений матч");
  }
}


function roleTagHtml(role) {
  const cls = {
    "Carry": "role-tag Carry",
    "Mid": "role-tag Mid",
    "Offlane": "role-tag Offlane",
    "Support": "role-tag Support",
    "Hard Support": "role-tag HardSupport"
  }[role] || "role-tag Unknown";
  return `<span class="${cls}">${role}</span>`;
}
