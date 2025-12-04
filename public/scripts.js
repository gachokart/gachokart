document.addEventListener("DOMContentLoaded", () => {
  const loadBtn = document.getElementById("loadBtn");
  const matchesDiv = document.getElementById("matches");
  
  loadBtn.addEventListener("click", async () => {
    matchesDiv.innerHTML = "Завантаження...";
    try {
      const response = await fetch("/api/matches");
      if (!response.ok) throw new Error("Помилка запиту: " + response.status);
      const data = await response.json();

      matchesDiv.innerHTML = "";
      if (data.matches && data.matches.length > 0) {
        data.matches.forEach((m, i) => {
          const div = document.createElement("div");
          div.className = "match";
          div.innerHTML = `
            <strong>Матч ${i + 1}</strong><br>
            Match ID: ${m.match_id}<br>
            Герой: ${m.hero_id}<br>
            Вбивства: ${m.kills}, Смерті: ${m.deaths}, Асисти: ${m.assists}<br>
            Результат: ${m.radiant_win ? "Radiant Win" : "Dire Win"}
          `;
          matchesDiv.appendChild(div);
        });
      } else {
        matchesDiv.textContent = "Немає матчів.";
      }
    } catch (err) {
      matchesDiv.textContent = "Помилка: " + err.message;
    }
  });
});
