import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
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


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// inisialisasi client AI
const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
});

// endpoint chat
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

    // simpan pesan user SEKALI
    sessions[sessionId].push({
      role: "user",
      content: message
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

Aturan respon:
- panik → tenangkan dulu
- lelah → singkat & lembut
- senang → santai
- netral → normal
`
        },
        ...sessions[sessionId]
      ]
    });

    const reply =
      response.output_text || "Yui lagi mikir bentar ya 🤍";

    sessions[sessionId].push({
      role: "assistant",
      content: reply
    });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "⚠️ Yui lagi error. Coba lagi ya."
    });
  }
});



app.listen(3000, () => {
  console.log("🤖 Yui AI server jalan di http://localhost:3000");
});
