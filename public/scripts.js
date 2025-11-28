// scripts.js

async function loadMatches() {
  try {
    const res = await fetch("/api/matches");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const matches = await res.json();

    console.log("Matches:", matches);

    // Завжди перевіряємо, що matches — масив
    if (Array.isArray(matches)) {
      const container = document.getElementById("matches");
      container.innerHTML = "";

      matches.forEach(match => {
        const div = document.createElement("div");
        div.textContent = `Match ${match.match_id} — Hero ${match.hero_id}`;
        container.appendChild(div);
      });
    } else {
      console.warn("Matches response is not an array:", matches);
    }
  } catch (err) {
    console.error("Error loading matches:", err);
  }
}

async function saveMatch() {
  const match = {
    match_id: document.getElementById("match_id").value,
    hero_id: document.getElementById("hero_id").value,
    role: document.getElementById("role").value,
    booster_ruiner: document.getElementById("booster_ruiner").value,
    radiant_win: document.getElementById("radiant_win").checked,
    kills: document.getElementById("kills").value,
    deaths: document.getElementById("deaths").value,
    assists: document.getElementById("assists").value
  };

  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(match)
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Saved:", data);

    // Після збереження перезавантажуємо список
    loadMatches();
  } catch (err) {
    console.error("Error saving match:", err);
  }
}

// Викликаємо при завантаженні сторінки
document.addEventListener("DOMContentLoaded", loadMatches);
