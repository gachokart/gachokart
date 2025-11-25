// 1. Перевір GET
fetch("https://gachokart.onrender.com/api/matches")
  .then(res => res.json())
  .then(data => console.log("GET /api/matches →", data));

// 2. Тестовий PUT (оновлюємо matches.json)
fetch("https://gachokart.onrender.com/api/matches", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    { match_id: 1, role: "Carry", booster_ruiner: "none" },
    { match_id: 2, role: "Support", booster_ruiner: "booster" }
  ])
})
  .then(res => res.json())
  .then(data => console.log("PUT /api/matches →", data))
  .catch(err => console.error("Error:", err));
