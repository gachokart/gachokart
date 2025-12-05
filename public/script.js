document.addEventListener("DOMContentLoaded", async () => {
  const matchesDiv = document.getElementById("matches");
  const detailsDiv = document.getElementById("details");

  // Рендер одного матчу (клік)
  const renderMatchDetails = async (m) => {
    detailsDiv.innerHTML = `<h2>Матч ${m.match_id}</h2><p>Завантаження...</p>`;

    // Завантаження повних даних матчу
    const resp = await fetch(`/api/match/${m.match_id}`);
    const matchData = await resp.json();

    // Дата і тривалість
    const date = new Date(matchData.start_time * 1000).toLocaleString("uk-UA");
    const minutes = Math.floor(matchData.duration / 60);
    const seconds = matchData.duration % 60;
    const duration = `${minutes} хв ${seconds} сек`;

    // Перемога/поразка (для акаунта 863386335)
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

    // Масив для збереження виборів по цьому матчу
    const selections = [];

    // Герої з двома селекторами (роль + статус)
    matchData.players.forEach((p, idx) => {
      const heroBlock = document.createElement("div");
      heroBlock.className = "hero-block";

      // Виділення мого героя
      const isMine = p.account_id === 863386335;
      if (isMine) {
        heroBlock.style.background = "#d1ffd1";
        heroBlock.innerHTML = `<strong>Герой ${idx+1} (ID: ${p.hero_id}) – Мій герой</strong><br>`;
      } else {
        heroBlock.innerHTML = `<strong>Герой ${idx+1} (ID: ${p.hero_id})</strong><br>`;
      }

      // Селектор ролі
      const roleSelect = document.createElement("select");
      ["Carry","Mid","Offlane","Support","Hard Support"].forEach(role => {
        const opt = document.createElement("option");
        opt.textContent = role;
        roleSelect.appendChild(opt);
      });
      heroBlock.appendChild(roleSelect);

      // Селектор статусу (0–10)
      const statusSelect = document.createElement("select");
      for (let k = 0; k <= 10; k++) {
        const opt = document.createElement("option");
        opt.textContent = k;
        statusSelect.appendChild(opt);
      }
      heroBlock.appendChild(statusSelect);

      // Збереження вибору в масив
      const saveSelection = () => {
        selections[idx] = {
          hero_id: p.hero_id,
          role: roleSelect.value,
          status: statusSelect.value,
          isMine
        };
      };
      roleSelect.addEventListener("change", saveSelection);
      statusSelect.addEventListener("change", saveSelection);
      saveSelection(); // ініціалізація

      detailsDiv.appendChild(heroBlock);
    });

    // Кнопка "Зберегти матч"
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Зберегти матч";
    saveBtn.style.marginTop = "20px";
    saveBtn.addEventListener("click", async () => {
      try {
        const resp = await fetch("/api/saveMatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: m.match_id, selections })
        });
        const result = await resp.json();
        alert(result.message);
        console.log("Збережено:", result);
        // Після збереження можна авто-оновити блок предікта:
        await renderPredictBlock();
      } catch (e) {
        alert("Помилка збереження матчу");
        console.error(e);
      }
    });
    detailsDiv.appendChild(saveBtn);

    // Кнопка "Зробити предікт"
    const predictBtn = document.createElement("button");
    predictBtn.textContent = "Зробити предікт";
    predictBtn.style.marginTop = "10px";
    predictBtn.addEventListener("click", async () => {
      await renderPredictBlock();
    });
    detailsDiv.appendChild(predictBtn);
  };

  // Рендер блоку предікта під деталями
  const renderPredictBlock = async () => {
    try {
      const resp = await fetch("/api/predict");
      const result = await resp.json();

      // Видаляємо попередній блок предікта, якщо був
      const oldPredict = detailsDiv.querySelector(".predict-block");
      if (oldPredict) oldPredict.remove();

      const predictBlock = document.createElement("div");
      predictBlock.className = "predict-block";
      predictBlock.style.border = "2px solid #4caf50";
      predictBlock.style.padding = "10px";
      predictBlock.style.marginTop = "20px";
      predictBlock.style.background = "#f6fff6";

      if (result.bestRole) {
        predictBlock.innerHTML = `
          <h3>${result.message}</h3>
          <p><strong>Рекомендована роль:</strong> ${result.bestRole}</p>
          <p><strong>Середній статус цієї ролі:</strong> ${result.avgStatus}</p>
          <p><strong>Шанс перемоги:</strong> ${result.winChance}</p>
          <h4>Усі ролі:</h4>
          <ul>
            ${result.allRoles.map(r => `<li>${r.role}: ${Number(r.avgStatus).toFixed(2)}</li>`).join("")}
          </ul>
        `;
      } else {
        predictBlock.innerHTML = `<p>${result.message}</p>`;
      }

      detailsDiv.appendChild(predictBlock);
    } catch (e) {
      console.error("Помилка предікта:", e);
      alert("Не вдалося отримати предікт");
    }
  };

  // Завантаження списку матчів
  try {
    const response = await fetch("/api/matches");
    const data = await response.json();
    matchesDiv.innerHTML = "";

    if (Array.isArray(data) && data.length > 0) {
      data.forEach((m, i) => {
        const div = document.createElement("div");
        div.className = "match";
        div.textContent = `Матч ${i + 1}: ID ${m.match_id}`;
        div.addEventListener("click", () => renderMatchDetails(m));
        matchesDiv.appendChild(div);
      });
    } else {
      matchesDiv.textContent = "Немає матчів.";
    }
  } catch (err) {
    matchesDiv.textContent = "Помилка: " + err.message;
  }
});
