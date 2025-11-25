import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

const FILE_PATH = path.join(process.cwd(), "matches.json");

app.use(cors({
  origin: ["https://gachokart.github.io"], // твій фронтенд
  methods: ["GET", "PUT", "OPTIONS"],      // 👈 додали OPTIONS
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, "[]");

app.get("/", (req, res) => res.send("GachoKart API is running"));

app.get("/api/matches", (req, res) => {
  const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
  res.json(data);
});

// 👇 відповідає на preflight
app.options("/api/matches", cors());

app.put("/api/matches", (req, res) => {
  const matches = req.body;
  fs.writeFileSync(FILE_PATH, JSON.stringify(matches, null, 2));
  res.json({ ok: true, count: matches.length });
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
