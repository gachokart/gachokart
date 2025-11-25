import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

const FILE_PATH = path.join(process.cwd(), "matches.json");

// ✅ CORS: дозволяємо GET, PUT і OPTIONS
app.use(cors({
  origin: ["https://gachokart.github.io"], // твій фронтенд
  methods: ["GET", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ✅ Якщо файл не існує — створюємо
if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, "[]");

// ✅ Кореневий маршрут
app.get("/", (req, res) => res.send("GachoKart API is running"));

// ✅ Preflight для будь-якого запиту
app.options("*", cors());

// ✅ Отримати matches.json
app.get("/api/matches", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    res.json(data);
  } catch (e) {
    res.status(500).send("Failed to read data");
  }
});

// ✅ Зберегти matches.json
app.put("/api/matches", (req, res) => {
  const data = req.body;
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
    // Якщо це масив — рахуємо довжину, якщо об’єкт — рахуємо matches.length
    const count = Array.isArray(data) ? data.length : (data.matches?.length || 0);
    res.json({ ok: true, count });
  } catch (e) {
    res.status(500).send("Failed to write data");
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
