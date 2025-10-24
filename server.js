// server.js
const express = require("express");
const app = express();
const PORT = 3000;

// віддавати статичні файли (наприклад game1.html)
app.use(express.static(__dirname));

// тестовий маршрут
app.get("/api/predict", (req, res) => {
  res.json({ message: "Привіт, маршрут працює!" });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
