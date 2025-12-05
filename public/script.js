async function loadMatches() {
  const res = await fetch("/api/matches");
  const matches = await res.json();
  const container = document.getElementById("matches");
  container.innerHTML = "";

  matches.forEach(m => {
    const div = document.createElement("div");
    div.innerHTML = `Match ID: ${m.match_id} 
      <button onclick="saveMatch(${m.match_id})">Зберегти</button>`;
    container.appendChild(div);
  });
}

async function saveMatch(matchId) {
  const res = await fetch(`/api/match/${matchId}`);
  const matchData = await res.json();

  const selections = matchData.players.map(p => ({
    hero_id: p.hero_id,
    role: p.lane_role === 1 ? "Carry" :
          p.lane_role === 2 ? "Mid" :
          p.lane_role === 3 ? "Offlane" :
          "Support",
    status: Math.floor(Math.random() * 10), // приклад
    isMine: p.account_id === 863386335
  }));

  const payload = {
    matchId: matchData.match_id,
    start_time: matchData.start_time,
    duration: matchData.duration,
    radiant_win: matchData.radiant_win,
    lobby_type: matchData.lobby_type,
    game_mode: matchData.game_mode,
    cluster: matchData.cluster,
    radiant_score: matchData.radiant_score,
    selections: selections
  };

  const saveRes = await fetch("/api/saveMatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await saveRes.json();
  alert(result.message);
}

async function getPredict() {
  const res = await fetch("/api/predict");
  const data = await res.json();
  document.getElementById("predict").innerText = JSON.stringify(data, null, 2);
}
