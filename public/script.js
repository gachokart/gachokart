document.addEventListener("DOMContentLoaded", async () => {
  const matchesDiv = document.getElementById("matches");
  const detailsDiv = document.getElementById("details");

  const response = await fetch("/api/matches");
  const data = await response.json();

  data.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "match";
    div.textContent = `Матч ${i+1}: ID ${m.match_id}`;
    
    div.addEventListener("click", async () => {
      detailsDiv.innerHTML = `<h2>Матч ${m.match_id}</h2><p>Завантаження...</p>`;
      const resp = await fetch(`/api/match/${m.match_id}`);
      const matchData = await resp.json();
      detailsDiv.innerHTML = `<h2>Матч ${m.match_id}</h2>`;
      
      matchData.players.forEach((p, idx) => {
        const heroBlock = document.createElement("div");
        heroBlock.innerHTML = `<strong>Герой ${idx+1} (ID: ${p.hero_id})</strong><br>`;
        for (let j=1; j<=2; j++) {
          const select = document.createElement("select");
          ["Роль 1","Роль 2","Роль 3","Роль 4","Роль 5"].forEach(r=>{
            const opt=document.createElement("option");
            opt.textContent=r;
            select.appendChild(opt);
          });
          heroBlock.appendChild(select);
        }
        detailsDiv.appendChild(heroBlock);
      });
    });

    matchesDiv.appendChild(div);
  });
});
