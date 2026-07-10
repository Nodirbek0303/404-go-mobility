import type { VercelRequest, VercelResponse } from "@vercel/node";

function getSimulatedResponse(prompt: string, lang: string): string {
  const text = prompt.toLowerCase();
  if (lang === "uz") {
    if (text.includes("taksi") || text.includes("salom") || text.includes("borish")) {
      return "Salom! Men 404-GO AI aqlli mobil yordamchisiman. Sizga taksi chaqirish, yetkazib berish, yuk tashish, smart parking va EV zaryadlashda yordam beraman. Bugun qanday xizmat kerak?";
    }
    return "Salom! Men 404-GO AI aqlli mobil yordamchisiman. Bugun qanday xizmat kerak?";
  }
  return "Hello! I am 404-GO AI Smart Assistant. What service do you need today?";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { messages, userLanguage = "uz" } = body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  const lastMessage = messages[messages.length - 1]?.content || "";
  return res.status(200).json({ text: getSimulatedResponse(lastMessage, userLanguage) });
}
