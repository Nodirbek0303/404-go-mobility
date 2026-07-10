import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSimulatedResponse } from "../lib/simulated-response";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, userLanguage = "uz", userApiKey } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    const finalApiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (finalApiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: finalApiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } },
        });

        const systemInstruction = `You are 404-GO AI Assistant. Reply in ${userLanguage}. Keep under 120 words.`;
        const contents = messages.map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents as never,
          config: { systemInstruction, temperature: 0.7 },
        });

        if (response.text) {
          return res.status(200).json({ text: response.text });
        }
      } catch (error: unknown) {
        return res.status(200).json({
          text: getSimulatedResponse(lastMessage, userLanguage),
          warning: "Gemini API experienced an error, falling back to simulated smart replies.",
          errorDetails: (error as Error).message,
        });
      }
    }

    return res.status(200).json({ text: getSimulatedResponse(lastMessage, userLanguage) });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message || "Internal server error" });
  }
}
