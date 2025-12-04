document.addEventListener("DOMContentLoaded", () => {
  const loadBtn = document.getElementById("loadBtn");
  const matchesDiv = document.getElementById("matches");

  loadBtn.addEventListener("click", async () => {
    matchesDiv.innerHTML = "Завантаження...";
    try {
      const response = await fetch("/api/matches");
      const data = await response.json();
      matchesDiv.innerHTML = "";

      if (data.matches && data.matches.length > 0) {
        data.matches.forEach((m, i) => {
          const div = document.createElement("div");
          div.textContent = `Матч ${i + 1}: ID ${m.match_id}, Герой ${m.hero_id}, K/D/A ${m.kills}/${m.deaths}/${m.assists}`;
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
