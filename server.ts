import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize express app
const app = express();
const PORT = 3000;

// Increase payload limits for base64 image uploading
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Enable robust CORS support to prevent CORS/null-origin "Load failed" errors on mobile devices
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin !== "null") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

/**
 * Lazy helper to initialize Gemini client safely
 */
function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY tanımlanmamış. Lütfen sağ üstteki 'Settings > Secrets' panelinden API anahtarınızı ekleyin.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

/**
 * Fallback parser for demo use cases or missing keys
 */
function parseLocalFallback(text: string): any[] {
  const textLower = text.toLowerCase();
  const items: any[] = [];

  // Match: Yumurta
  if (textLower.includes("yumurta")) {
    const qtyMatch = textLower.match(/(\d+)\s*(?:adet)?\s*(?:haşlanmış)?\s*yumurta/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    items.push({
      food_name: "Haşlanmış Yumurta",
      amount: `${qty} adet`,
      calories: qty * 78,
      protein: qty * 6,
      carbs: qty * 0,
      fat: qty * 5
    });
  }

  // Match: Peynir
  if (textLower.includes("peynir")) {
    const qtyMatch = textLower.match(/(\d+)\s*(?:gram|gr)?\s*(?:beyaz)?\s*peynir/);
    let qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 50;
    if (qty < 5) qty = qty * 30; // handle slice estimation (e.g., 2 dilim -> 60 gram)
    items.push({
      food_name: "Beyaz Peynir",
      amount: `${qty} gram`,
      calories: Math.round((qty * 300) / 100),
      protein: Math.round((qty * 20) / 100),
      carbs: Math.round((qty * 2) / 100),
      fat: Math.round((qty * 24) / 100)
    });
  }

  // Match: Zeytin
  if (textLower.includes("zeytin")) {
    const qtyMatch = textLower.match(/(\d+)\s*(?:adet)?\s*zeytin/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 5;
    items.push({
      food_name: "Siyah Zeytin",
      amount: `${qty} adet`,
      calories: qty * 9,
      protein: 0,
      carbs: Math.round(qty * 0.2),
      fat: Math.round(qty * 0.9)
    });
  }

  // Match: Ekmek
  if (textLower.includes("ekmek")) {
    const qtyMatch = textLower.match(/(\d+)\s*(?:dilim)?\s*ekmek/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    items.push({
      food_name: "Tam Buğday Ekmek",
      amount: `${qty} dilim`,
      calories: qty * 68,
      protein: Math.round(qty * 2.5),
      carbs: qty * 13,
      fat: Math.round(qty * 0.5)
    });
  }

  // Match: Süt
  if (textLower.includes("süt") || textLower.includes("sut")) {
    const qtyMatch = textLower.match(/(\d+)\s*(?:bardak|su bardağı)?\s*süt/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    items.push({
      food_name: "Yarım Yağlı Süt",
      amount: `${qty} su bardağı (200 ml)`,
      calories: qty * 115,
      protein: qty * 6,
      carbs: qty * 9,
      fat: qty * 6
    });
  }

  // Match: Tavuk
  if (textLower.includes("tavuk")) {
    const qtyMatch = textLower.match(/(\d+)\s*(?:gram|gr)?\s*tavuk/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 150;
    items.push({
      food_name: "Izgara Tavuk Göğsü",
      amount: `${qty} gram`,
      calories: Math.round((qty * 165) / 100),
      protein: Math.round((qty * 31) / 100),
      carbs: 0,
      fat: Math.round((qty * 3.6) / 100)
    });
  }

  // Match: Pilav
  if (textLower.includes("pilav")) {
    const qtyMatch = textLower.match(/(\d+)\s*(?:gram|gr|porsiyon)?\s*pilav/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    items.push({
      food_name: "Pirinç Pilavı",
      amount: qtyMatch && textLower.includes("gram") ? `${qty} gram` : `${qty} porsiyon`,
      calories: qtyMatch && textLower.includes("gram") ? Math.round(qty * 1.3) : qty * 250,
      protein: qtyMatch && textLower.includes("gram") ? Math.round(qty * 0.02) : qty * 4,
      carbs: qtyMatch && textLower.includes("gram") ? Math.round(qty * 0.28) : qty * 53,
      fat: qtyMatch && textLower.includes("gram") ? Math.round(qty * 0.04) : qty * 6
    });
  }

  // If nothing could be extracted, give a placeholder breakfast
  if (items.length === 0) {
    items.push({
      food_name: "Yulaf Lapası (Muzlu)",
      amount: "1 porsiyon",
      calories: 320,
      protein: 10,
      carbs: 58,
      fat: 6
    });
  }

  return items;
}

// Check configuration state
app.get("/api/config-status", (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  const hasKey = !!key && key !== "MY_GEMINI_API_KEY";
  res.json({ hasKey });
});

// Primary Nutrition Extract API
app.post("/api/extract-nutrition", async (req, res) => {
  const { text, image, mimeType, useDemoFallback } = req.body;

  // Let check if developer configured a key
  const key = process.env.GEMINI_API_KEY;
  const isKeyEmpty = !key || key === "MY_GEMINI_API_KEY";

  if (isKeyEmpty || useDemoFallback) {
    console.log("Using demo local fallback parsing logic...");
    if (text) {
      const demoData = parseLocalFallback(text);
      return res.json({ success: true, isDemo: true, data: demoData });
    } else {
      // Photo request with no key
      return res.json({
        success: true,
        isDemo: true,
        data: [
          {
            food_name: "Görsel Tahlili (Demo Modu)",
            amount: "1 porsiyon yiyecek",
            calories: 380,
            protein: 22,
            carbs: 45,
            fat: 12
          }
        ]
      });
    }
  }

  try {
    const ai = getGenAI();
    let contents: any[] = [];

    if (image) {
      contents.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: image,
        }
      });
    }

    const promptText = `You are a strict, precise nutrition and calorie tracking assistant. 
Your job is to extract food items, amounts, and calculate calories and macros (protein, carbohydrate, fat in grams) from the user's input (which could be a natural language description, an image, or both).

CRITICAL OUTPUT RULES:
1. You must ONLY output a raw JSON array conforming to the requested schema. Do not output markdown, preambles, or conversational formatting. Just raw JSON.
2. All macro fields (calories, protein, carbs, fat) MUST be strict integers. Never append units like "G", "g", or "Kcal" to these numbers. If a value is unknown or zero, output 0.
3. Ensure that calories and macros are logically distinct. Do not accidentally copy the calorie value into the fat, protein, or carbs field (e.g., if ice cream is 130 kcal, its fat content is not 130g). Calories is always distinct from individual macro values in grams.
4. Keep the amount string clean. Do not append broken characters, language artifacts, or extra text (e.g., write "2 adet", never "2 adet.let").
5. Translate all food_name outputs into clean, recognizable Turkish.

If the input described or showed multiple items, return them all in the array. 
If the input is ambiguous, make your best professional estimate based on standard Turkish culinary portions.

User prompt / contextual text: "${text || 'Fotoğraftaki yemeğin besin değerlerini çıkar.'}"`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              food_name: {
                type: Type.STRING,
                description: "The name of the food item in Turkish. E.g., 'Haşlanmış Yumurta'.",
              },
              amount: {
                type: Type.STRING,
                description: "The amount/portion in Turkish. E.g., '2 adet', '50 gram', '1 porsiyon'.",
              },
              calories: {
                type: Type.INTEGER,
                description: "Estimated calories in kcal.",
              },
              protein: {
                type: Type.INTEGER,
                description: "Estimated protein in grams.",
              },
              carbs: {
                type: Type.INTEGER,
                description: "Estimated carbohydrates in grams.",
              },
              fat: {
                type: Type.INTEGER,
                description: "Estimated fat in grams.",
              }
            },
            required: ["food_name", "amount", "calories", "protein", "carbs", "fat"],
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini AI modelinden boş bir yanıt döndü.");
    }

    let parsedArray;
    try {
      parsedArray = JSON.parse(resultText.trim());
    } catch (parseErr) {
      console.error("JSON parsing failed. Raw response was:", resultText);
      // Fallback regex extraction from markdown
      const jsonRegex = /\[[\s\S]*?\]/;
      const matched = resultText.match(jsonRegex);
      if (matched) {
        parsedArray = JSON.parse(matched[0]);
      } else {
        throw new Error("Yapay zekanın yanıtı geçerli bir liste formatına dönüştürülemedi.");
      }
    }

    return res.json({ success: true, isDemo: false, data: parsedArray });

  } catch (err: any) {
    console.error("Express Gemini request failed:", err);
    return res.status(500).json({
      error: err?.message || "Yemek analizi yapılırken beklenmedik bir hata oluştu.",
      details: err?.stack || ""
    });
  }
});

// Configure client asset serving and index path
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
  });
}

startServer();
