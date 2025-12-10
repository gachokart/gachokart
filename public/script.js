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

async function openSavedMatch(matchId) {
  try {
    // тягнемо гравців цього матчу
    const res = await fetch(`/api/savedMatchPlayers/${matchId}`);
    const players = await res.json();

    // тягнемо мета-дані всіх матчів і знаходимо потрібний
    const metaRes = await fetch(`/api/savedMatches`);
    const allMatches = await metaRes.json();
    const matchMeta = allMatches.find(m => m.match_id == matchId);

    const table = byId("playersTable");
    table.innerHTML = "";

    // заповнюємо мета-блок
    byId("formTitle").innerText = `Збережений матч ${matchId}`;
    byId("metaMatchId").innerText = matchMeta?.match_id || "—";
    byId("metaRadiantWin").innerText = matchMeta?.radiant_win ? "Radiant переміг" : "Dire переміг";
    byId("metaDuration").innerText = matchMeta?.duration ? `${Math.floor(matchMeta.duration/60)} хв` : "—";

    if (matchMeta?.start_time) {
      const date = new Date(matchMeta.start_time);
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
    const myIndex = players.findIndex(p => p.is_mine);
    let myTeam, enemyTeam;
    if (myIndex < 5) {
      myTeam = players.slice(0, 5);
      enemyTeam = players.slice(5, 10);
    } else {
      myTeam = players.slice(5, 10);
      enemyTeam = players.slice(0, 5);
    }

    // малюємо мою команду
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

    // малюємо суперників
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
  if (!currentMatchId || currentSelections.length === 0) {
    alert("Нічого зберігати: немає матчу або гравців");
    return;
  }

  const payload = {
    matchId: currentMatchId,
    start_time: currentMeta.start_time || Math.floor(Date.now() / 1000),
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

// ------------ Saved matches (static view with names + portraits) ------------
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

    const table = byId("playersTable");
    table.innerHTML = "";

    // визначаємо мою команду через індекс у масиві
    const myIndex = players.findIndex(p => p.is_mine);
    let myTeam, enemyTeam;
    if (myIndex < 5) {
      myTeam = players.slice(0, 5);
      enemyTeam = players.slice(5, 10);
    } else {
      myTeam = players.slice(5, 10);
      enemyTeam = players.slice(0, 5);
    }

    // малюємо мою команду
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

    // малюємо суперників
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
