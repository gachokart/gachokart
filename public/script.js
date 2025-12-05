document.addEventListener("DOMContentLoaded", async () => {
  const matchesDiv = document.getElementById("matches");
  const detailsDiv = document.getElementById("details");

  try {
    const response = await fetch("/api/matches");
    const data = await response.json();
    matchesDiv.innerHTML = "";

    if (Array.isArray(data) && data.length > 0) {
      data.forEach((m, i) => {
        const div = document.createElement("div");
        div.className = "match";
        div.textContent = `Матч ${i+1}: ID ${m.match_id}`;
        
        div.addEventListener("click", async () => {
          detailsDiv.innerHTML = `<h2>Матч ${m.match_id}</h2><p>Завантаження...</p>`;
          const resp = await fetch(`/api/match/${m.match_id}`);
          const matchData = await resp.json();

          // Дата
          const date = new Date(matchData.start_time * 1000).toLocaleString("uk-UA");

          // Тривалість
          const minutes = Math.floor(matchData.duration / 60);
          const seconds = matchData.duration % 60;
          const duration = `${minutes} хв ${seconds} сек`;

          // Перемога/поразка (для твого акаунта)
          const myPlayer = matchData.players.find(p => p.account_id === 863386335);
          let result = "Поразка";
          if (myPlayer) {
            const isRadiant = myPlayer.player_slot < 128;
            if ((isRadiant && matchData.radiant_win) || (!isRadiant && !matchData.radiant_win)) {
              result = "Перемога";
            }
          }

          // Заголовок з даними матчу
          detailsDiv.innerHTML = `
            <h2>Матч ${m.match_id}</h2>
            <p><strong>Дата:</strong> ${date}</p>
            <p><strong>Тривалість:</strong> ${duration}</p>
            <p><strong>Результат:</strong> ${result}</p>
          `;

          // Герої з селекторами
          matchData.players.forEach((p, idx) => {
            const heroBlock = document.createElement("div");
            heroBlock.className = "hero-block";

            // Виділення мого героя
            if (p.account_id === 863386335) {
              heroBlock.style.background = "#d1ffd1"; // зелений фон
              heroBlock.innerHTML = `<strong>Герой ${idx+1} (ID: ${p.hero_id}) – Мій герой</strong><br>`;
            } else {
              heroBlock.innerHTML = `<strong>Герой ${idx+1} (ID: ${p.hero_id})</strong><br>`;
            }
            
            // Селектор ролі
            const roleSelect = document.createElement("select");
            ["Carry","Mid","Offlane","Support","Hard Support"].forEach(role=>{
              const opt=document.createElement("option");
              opt.textContent=role;
              roleSelect.appendChild(opt);
            });
            heroBlock.appendChild(roleSelect);

            // Селектор статусу (0-10)
            const statusSelect = document.createElement("select");
            for (let k=0; k<=10; k++) {
              const opt=document.createElement("option");
              opt.textContent=k;
              statusSelect.appendChild(opt);
            }
            heroBlock.appendChild(statusSelect);

            detailsDiv.appendChild(heroBlock);
          });

          // Кнопка "Зберегти матч"
          const saveBtn = document.createElement("button");
          saveBtn.textContent = "Зберегти матч";
          saveBtn.style.marginTop = "20px";
          saveBtn.addEventListener("click", () => {
            alert(`Матч ${m.match_id} збережено!`);
            // тут можна додати логіку збереження у базу чи локально
          });
          detailsDiv.appendChild(saveBtn);
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
