import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// PATH SETUP
// =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =======================
// SERVE HTML
// =======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "web.html"));
});

// =======================
// SESSION MEMORY
// =======================
const sessions = {};

function deteksiMood(teks) {
  const t = teks.toLowerCase();

  if (
    t.includes("panik") ||
    t.includes("kok gini") ||
    t.includes("error") ||
    t.includes("kenapa")
  ) return "panik";

  if (
    t.includes("capek") ||
    t.includes("lelah") ||
    t.includes("nggak ngerasa apa") ||
    t.includes("males")
  ) return "lelah";

  if (
    t.includes("yey") ||
    t.includes("hore") ||
    t.includes("seneng")
  ) return "senang";

  return "netral";
}

// =======================
// OPENAI CLIENT
// =======================
const client = new OpenAI({
  apiKey: process.env.AI_API_KEY, // pastikan ini ada di Railway
});

// =======================
// CHAT ENDPOINT
// =======================
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!sessionId) {
      return res.json({ reply: "Session tidak valid" });
    }

    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

    const mood = deteksiMood(message);

    sessions[sessionId].push({
      role: "user",
      content: message,
    });

    if (sessions[sessionId].length > 10) {
      sessions[sessionId].shift();
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `
Kamu adalah Yui, AI asisten belajar yang:
- ramah
- sabar
- nggak menggurui
- berasa kayak temen ngobrol

Mood user saat ini: ${mood}
`
        },
        ...sessions[sessionId]
      ],
    });

    const reply =
      response.output_text || "Yui lagi mikir bentar ya 🤍";

    sessions[sessionId].push({
      role: "assistant",
      content: reply,
    });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "⚠️ Yui lagi error. Coba lagi ya.",
    });
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Yui AI server jalan di port ${PORT}`);
});
