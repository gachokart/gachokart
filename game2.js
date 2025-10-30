const accountId = "863386335"; // заміни на свій OpenDota ID

async function loadAndMerge() {
  const [localHeroes, apiHeroes, allHeroes] = await Promise.all([
    fetch("heroes.json").then(r => r.json()),
    fetch(`https://api.opendota.com/api/players/${accountId}/heroes`).then(r => r.json()),
    fetch("https://api.opendota.com/api/heroes").then(r => r.json())
  ]);

  // Мапа hero_id → localized_name
  const idToName = {};
  allHeroes.forEach(h => idToName[h.id] = h.localized_name);

  // Злиття по name ↔ localized_name
  const merged = localHeroes.map(local => {
    const apiHero = apiHeroes.find(a => idToName[a.hero_id] === local.name);
    return {
      ...local,
      games: apiHero ? apiHero.games : 0,
      wins: apiHero ? apiHero.win : 0,
      myWinrate: apiHero && apiHero.games > 0
        ? (apiHero.win / apiHero.games * 100).toFixed(1) + "%"
        : "0%"
    };
  });

  renderTable(merged);
}

function renderTable(data) {
  const container = document.getElementById("draftSummary");
  const table = document.createElement("table");
  table.innerHTML = `
    <tr>
      <th>Герой</th>
      <th>Глобальний WR</th>
      <th>Мій WR</th>
      <th>Ігри</th>
    </tr>
  `;
  data.forEach(h => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${h.name}</td>
      <td>${(h.winrate * 100).toFixed(1)}%</td>
      <td>${h.myWinrate}</td>
      <td>${h.games}</td>
    `;
    table.appendChild(row);
  });
  container.innerHTML = "";
  container.appendChild(table);
}

loadAndMerge();
