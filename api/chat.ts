import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { getSimulatedResponse } from "../lib/simulated-response";

async function generateContentWithFallback(
  aiClient: GoogleGenAI,
  params: { contents: unknown; config?: unknown }
) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      return await aiClient.models.generateContent({
        model,
        contents: params.contents as never,
        config: params.config as never,
      });
    } catch (error: unknown) {
      lastError = error;
      const errMsg = ((error as Error).message || "").toLowerCase();
      if (
        errMsg.includes("key") ||
        errMsg.includes("invalid") ||
        errMsg.includes("api_key_invalid") ||
        errMsg.includes("unauthorized") ||
        errMsg.includes("forbidden")
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, userLanguage = "uz", userApiKey } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  const lastMessage = messages[messages.length - 1]?.content || "";
  const finalApiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!finalApiKey) {
    return res.status(200).json({ text: getSimulatedResponse(lastMessage, userLanguage) });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: finalApiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const systemInstruction = `
      You are 404-GO AI Assistant for Uzbekistan mobility services.
      Reply in ${userLanguage === "uz" ? "Uzbek (Latin)" : userLanguage === "ru" ? "Russian" : "English"}.
      Keep replies under 120 words. Include [BOOKING_ACTION: ...] when booking is appropriate.
    `;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await generateContentWithFallback(ai, {
      contents,
      config: { systemInstruction, temperature: 0.7 },
    });

    return res.status(200).json({ text: response.text || "Uzr, javob yuklashda xatolik yuz berdi." });
  } catch (error: unknown) {
    return res.status(200).json({
      text: getSimulatedResponse(lastMessage, userLanguage),
      warning: "Gemini API experienced an error, falling back to simulated smart replies.",
      errorDetails: (error as Error).message,
    });
  }
}
