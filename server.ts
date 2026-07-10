import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { getSimulatedResponse } from "./lib/simulated-response";

dotenv.config();

async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export async function createApp(options: { apiOnly?: boolean } = {}) {
  const app = express();

  // Enable JSON body parsing
  app.use(express.json());

  // Initialize Gemini AI Client
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API client initialized successfully.");
    } catch (e) {
      console.error("Failed to initialize Gemini API client:", e);
    }
  } else {
    console.warn("GEMINI_API_KEY is not defined in environment variables. AI Chat features will fall back to simulated responses.");
  }

  // Helper to generate content with fallback models to survive high-demand periods (503 status code)
  async function generateContentWithFallback(
    aiClient: GoogleGenAI,
    params: {
      contents: any;
      config?: any;
    }
  ) {
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Attempting generateContent with model: ${model}`);
        const response = await aiClient.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (error: any) {
        console.warn(`generateContent failed for model ${model}:`, error.message || error);
        lastError = error;
        const errMsg = (error.message || "").toLowerCase();
        // If it's an API Key error, do not retry other models as the key itself is invalid.
        if (
          errMsg.includes("key") ||
          errMsg.includes("invalid") ||
          errMsg.includes("api_key_invalid") ||
          errMsg.includes("not found") ||
          errMsg.includes("unauthorized") ||
          errMsg.includes("forbidden")
        ) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiEnabled: !!ai });
  });

  // Key verification endpoint
  app.post("/api/check-key", async (req, res) => {
    const { userApiKey } = req.body;
    const keyToTest = userApiKey || process.env.GEMINI_API_KEY;
    if (!keyToTest) {
      return res.status(400).json({ success: false, error: "No API key found. Please enter an API key." });
    }

    try {
      const testAi = new GoogleGenAI({
        apiKey: keyToTest,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      // Simple verification call using the standard gemini-3.5-flash model, falling back if needed
      const response = await generateContentWithFallback(testAi, {
        contents: [{ role: "user", parts: [{ text: "Respond only with the word OK." }] }],
        config: {
          maxOutputTokens: 5,
        },
      });
      
      if (response && response.text) {
        return res.json({ success: true, message: "API key is valid and fully activated!" });
      } else {
        return res.status(500).json({ success: false, error: "Empty response from Gemini API" });
      }
    } catch (e: any) {
      console.error("API Key check error:", e);
      return res.status(500).json({ success: false, error: e.message || "Invalid API key" });
    }
  });

  // Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    const { messages, userLanguage = "uz", userApiKey } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";

    const finalApiKey = userApiKey || process.env.GEMINI_API_KEY;

    let activeAi = ai;
    if (finalApiKey && (!activeAi || finalApiKey !== process.env.GEMINI_API_KEY)) {
      try {
        activeAi = new GoogleGenAI({
          apiKey: finalApiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.error("Failed to initialize dynamic Gemini API client:", e);
      }
    }

    if (!activeAi) {
      // Fallback response if API key is not present or initialization failed
      console.log("No Gemini API key. Generating high-quality simulated response.");
      const simulatedResponse = getSimulatedResponse(lastMessage, userLanguage);
      return res.json({ text: simulatedResponse });
    }

    try {
      // Prepare chat history for Gemini
      const systemInstruction = `
        You are 404-GO AI Assistant, a highly advanced, super-friendly mobility & smart transport assistant for the 404-GO Super Mobility Platform in Uzbekistan.
        The user is currently interacting with the 404-GO app on their device.
        Your goals:
        1. Be incredibly helpful, polite, and professional.
        2. Reply in the selected language: ${userLanguage === "uz" ? "Uzbek (Latin)" : userLanguage === "ru" ? "Russian" : "English"}.
        3. Keep your replies concise, structured, and under 120 words.
        4. You can assist with booking a taxi, courier delivery, cargo transport, smart parking, EV charging, route planning, checking prices, checking traffic, etc.
        
        CRITICAL booking detection feature:
        If the user wants to book a service (e.g. taxi, delivery, cargo, parking, EV charging) and specifies details like destination, origin, or items, you must include a special structured code at the end of your message in square brackets like this:
        [BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]
        or
        [BOOKING_ACTION: type=delivery, item=Hujjatlar, price=35000]
        or
        [BOOKING_ACTION: type=cargo, from=Qo'yliq, to=Sebzor, price=210000]
        or
        [BOOKING_ACTION: type=parking, from=Tashkent City, price=8000]
        or
        [BOOKING_ACTION: type=ev_charge, from=Magic City, price=15000]
        
        The frontend will parse this tag and automatically trigger a live interactive booking simulation in the app simulator!
        So, whenever appropriate, generate a realistic booking action block! Keep the price realistic in Uzbek So'm (so'm).
        Example: "Albatta, sizga Chorsudan Magic Citygacha taksi buyurtma qilishga yordam beraman. Yo'l haqi taxminan 28 000 so'm bo'ladi. [BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]"
      `;

      // Structure conversation history for Gemini contents array
      const contents = messages.map((m: any) => {
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        };
      });

      const response = await generateContentWithFallback(activeAi, {
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Uzr, javob yuklashda xatolik yuz berdi.";
      res.json({ text: replyText });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const simulatedResponse = getSimulatedResponse(lastMessage, userLanguage);
      res.json({
        text: simulatedResponse,
        warning: "Gemini API experienced an error, falling back to simulated smart replies.",
        errorDetails: error.message,
      });
    }
  });

  // Vite middleware for development or serving built files in production
  if (!options.apiOnly) {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  return app;
}

if (!process.env.VERCEL) {
  startServer();
}
