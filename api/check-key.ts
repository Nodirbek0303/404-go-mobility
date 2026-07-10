import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userApiKey } = req.body || {};
  const keyToTest = userApiKey || process.env.GEMINI_API_KEY;

  if (!keyToTest) {
    return res.status(400).json({ success: false, error: "No API key found. Please enter an API key." });
  }

  try {
    const testAi = new GoogleGenAI({
      apiKey: keyToTest,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const response = await testAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: "Respond only with the word OK." }] }],
      config: { maxOutputTokens: 5 },
    });

    if (response?.text) {
      return res.status(200).json({ success: true, message: "API key is valid and fully activated!" });
    }

    return res.status(500).json({ success: false, error: "Empty response from Gemini API" });
  } catch (e: unknown) {
    return res.status(500).json({ success: false, error: (e as Error).message || "Invalid API key" });
  }
}
