import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { getSimulatedResponse } from "../lib/simulated-response";

const SYSTEM = (userLanguage: string) => `
You are 404-GO AI Assistant for Uzbekistan mobility.
STRICT service rules — never mix roles:
- taxi: passenger cars only (ride-hailing).
- delivery: LIGHT vehicles ONLY (Matiz, Damas, Spark, Cobalt) for mail, documents, and small parcels.
- cargo: CARGO TRUCKS ONLY (Gazelle, Isuzu, Fuso, Kamaz) for freight.
- parking: show and book PARKING LOTS only.
- ev_charge: EV CHARGING STATIONS only.

Reply in ${userLanguage === "uz" ? "Uzbek (Latin)" : userLanguage === "ru" ? "Russian" : "English"}.
Keep replies under 120 words.

Booking tags:
[BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]
[BOOKING_ACTION: type=delivery, item=Hujjatlar/Pochta, price=35000]
[BOOKING_ACTION: type=cargo, from=Qo'yliq, to=Sebzor, price=210000]
[BOOKING_ACTION: type=parking, from=Tashkent City P1, price=8000]
[BOOKING_ACTION: type=ev_charge, from=EV Hub Magic City, price=15000]
`;

async function tryGemini(apiKey: string, messages: { role: string; content: string }[], userLanguage: string) {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
  const models = ["gemini-2.0-flash", "gemini-2.5-flash-preview-05-20"];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        config: { systemInstruction: SYSTEM(userLanguage), maxOutputTokens: 512 },
      });
      const text = response.text;
      if (text) return text;
    } catch {
      continue;
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { messages, userLanguage = "uz", userApiKey } = body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  const lastMessage = messages[messages.length - 1]?.content || "";
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const aiText = await tryGemini(apiKey, messages, userLanguage);
      if (aiText) return res.status(200).json({ text: aiText });
    } catch (e) {
      console.error("Gemini error:", e);
    }
  }

  return res.status(200).json({ text: getSimulatedResponse(lastMessage, userLanguage) });
}
