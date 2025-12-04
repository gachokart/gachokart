document.addEventListener("DOMContentLoaded", async () => {
  const matchesDiv = document.getElementById("matches");
  const detailsDiv = document.getElementById("details");

  // Автозавантаження матчів
  try {
    const response = await fetch("/api/matches");
    const data = await response.json();
    matchesDiv.innerHTML = "";

    if (Array.isArray(data) && data.length > 0) {
      data.forEach((m, i) => {
        const div = document.createElement("div");
        div.className = "match";
        div.textContent = `Матч ${i + 1}: ID ${m.match_id}`;
        
        // При кліку показуємо деталі справа
        div.addEventListener("click", async () => {
          detailsDiv.innerHTML = `<h2>Матч ${i + 1} – ${m.match_id}</h2><p>Завантаження героїв...</p>`;
          
          try {
            const resp = await fetch(`/api/match/${m.match_id}`);
            const matchData = await resp.json();
            
            detailsDiv.innerHTML = `<h2>Матч ${i + 1} – ${m.match_id}</h2>`;
            
            matchData.players.forEach((p, idx) => {
              const heroBlock = document.createElement("div");
              heroBlock.className = "hero-block";
              heroBlock.innerHTML = `<strong>Герой ${idx+1} (ID: ${p.hero_id})</strong><br>`;
              
              // Додаємо 2 селектори під кожного героя
              for (let j = 1; j <= 2; j++) {
                const select = document.createElement("select");
                for (let k = 1; k <= 5; k++) {
                  const option = document.createElement("option");
                  option.value = k;
                  option.textContent = `Роль ${k}`;
                  select.appendChild(option);
                }
                heroBlock.appendChild(select);
              }
              
              detailsDiv.appendChild(heroBlock);
            });
          } catch (err) {
            detailsDiv.innerHTML = "Помилка завантаження героїв: " + err.message;
          }
        });

        matchesDiv.appendChild(div);
      });
    } else {
      matchesDiv.textContent = "Немає матчів.";
    }
  } catch (err) {
    matchesDiv.textContent = "Помилка: " + err.message;
  }
});
