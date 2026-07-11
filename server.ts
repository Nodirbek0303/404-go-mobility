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

  const {
    handlePlatformConfig,
    handleGeocode,
    handleOrdersList,
    handleOrderCreate,
    handleOrderGet,
    handleOrderDispatch,
    handleOrderCancel,
    handleOrderPatch,
    handleDriversList,
    handleDriverGet,
    handleDriverStatus,
    handleDriverAccept,
    handleDriverLocation,
    handlePaymentCreate,
    handlePaymentConfirm,
    handlePaymentConfig,
  } = await import("./lib/api/platformHandlers");

  app.get("/api/config", handlePlatformConfig);
  app.get("/api/geocode", handleGeocode);

  app.get("/api/orders", handleOrdersList);
  app.post("/api/orders", handleOrderCreate);
  app.get("/api/orders/:id", handleOrderGet);
  app.patch("/api/orders/:id", handleOrderPatch);
  app.post("/api/orders/:id/dispatch", handleOrderDispatch);
  app.post("/api/orders/:id/cancel", handleOrderCancel);

  app.get("/api/drivers", handleDriversList);
  app.get("/api/drivers/:id", handleDriverGet);
  app.post("/api/drivers/:id/status", handleDriverStatus);
  app.post("/api/drivers/:id/accept", handleDriverAccept);
  app.post("/api/drivers/:id/location", handleDriverLocation);

  app.get("/api/payments/config", handlePaymentConfig);
  app.post("/api/payments/create", handlePaymentCreate);
  app.post("/api/payments/confirm", handlePaymentConfirm);

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
        You are 404-GO AI Assistant for Uzbekistan mobility.
        STRICT service rules — never mix roles:
        - taxi: passenger cars only (ride-hailing).
        - delivery: LIGHT vehicles ONLY (Matiz, Damas, Spark, Cobalt) for mail, documents, and small parcels. Never use trucks or taxis.
        - cargo: CARGO TRUCKS ONLY (Gazelle, Isuzu, Fuso, Kamaz) for freight. Never use light cars.
        - parking: show and book PARKING LOTS only. No routes or drivers.
        - ev_charge: EV CHARGING STATIONS only. No fuel stations.
        
        Reply in ${userLanguage === "uz" ? "Uzbek (Latin)" : userLanguage === "ru" ? "Russian" : "English"}.
        Keep replies under 120 words.
        
        Booking tags (use correct type only):
        [BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]
        [BOOKING_ACTION: type=delivery, item=Hujjatlar/Pochta, price=35000]
        [BOOKING_ACTION: type=cargo, from=Qo'yliq, to=Sebzor, price=210000]
        [BOOKING_ACTION: type=parking, from=Tashkent City P1, price=8000]
        [BOOKING_ACTION: type=ev_charge, from=EV Hub Magic City, price=15000]
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
