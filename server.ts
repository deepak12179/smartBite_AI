import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set body parser size limit to handle base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY", // fallback to prevent startup crash if undefined
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for schema-aware analysis
app.post("/api/analyze-food", async (req, res): Promise<any> => {
  try {
    const { imageBase64, mimeType, userProfile } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing image data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return beautiful mock response with alert if API key is missing
      return res.json({
        isMock: true,
        foodName: "Grilled Salmon with Broccoli",
        confidence: 0.95,
        calories: 380,
        protein: 34,
        carbs: 8,
        fats: 22,
        vitamins: ["Vitamin D: 120%", "Vitamin B12: 80%", "Vitamin A: 15%"],
        minerals: ["Potassium: 12%", "Selenium: 90%", "Iron: 6%"],
        dietaryFiber: 3,
        healthScore: 92,
        summary: "This is a remarkably balanced, high-protein meal. Salmon is rich in healthy omega-3 fatty acids and broccoli provides excellent fiber and essential vitamins.",
        suitability: {
          recommendation: "EAT",
          reason: `Highly aligned with your goals. Its high protein content (${34}g) and low carbohydrates support cellular function, muscle repair, and sustained energy levels.`
        }
      });
    }

    // Process using gemini-3.5-flash
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const targetPref = userProfile ? JSON.stringify(userProfile) : "Healthy Balanced Diet";

    const promptText = `Analyze the food in this image. Detect the main food items, assess their nutritional profiles and calculate estimated calories, protein (g), carbohydrates (g), fats (g), dietary fiber (g), major vitamins, and major minerals.
    
Based on the user's demographic and health profile: ${targetPref}, compute a health suitability score out of 100, decide whether they should EAT, MODERATE, or AVOID this food, and write a helpful summary explaining the reasons.
Ensure the response complies EXACTLY with the schema specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "Name of the analyzed dish/food item" },
            confidence: { type: Type.NUMBER, description: "Confidence score of recognition (0.0 to 1.0)" },
            calories: { type: Type.INTEGER, description: "Total estimated calories in kcal" },
            protein: { type: Type.INTEGER, description: "Total protein content in grams" },
            carbs: { type: Type.INTEGER, description: "Total carbs content in grams" },
            fats: { type: Type.INTEGER, description: "Total fats content in grams" },
            dietaryFiber: { type: Type.INTEGER, description: "Dietary fiber content in grams if applicable" },
            vitamins: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of dominant vitamins with estimated daily value %"
            },
            minerals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of dominant minerals with estimated daily value %"
            },
            healthScore: { type: Type.INTEGER, description: "A wellness score from 0 to 100 based on nutritional density" },
            summary: { type: Type.STRING, description: "Nutritional summary of the food" },
            suitability: {
              type: Type.OBJECT,
              properties: {
                recommendation: { type: Type.STRING, description: "EAT, MODERATE, or AVOID" },
                reason: { type: Type.STRING, description: "Personalized explanation linked back to their profile goals" }
              },
              required: ["recommendation", "reason"]
            }
          },
          required: ["foodName", "confidence", "calories", "protein", "carbs", "fats", "vitamins", "minerals", "healthScore", "summary", "suitability"]
        }
      }
    });

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);
    res.json(parsedData);
  } catch (err: any) {
    console.error("Food analysis error:", err);
    res.status(500).json({ error: "Failed to analyze image: " + err.message });
  }
});

// AI Estimation for typed search query
app.post("/api/estimate-food", async (req, res): Promise<any> => {
  try {
    const { foodName, userProfile } = req.body;

    if (!foodName) {
      return res.status(400).json({ error: "Missing food name search query" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Mock search prediction if Gemini is absent
      return res.json({
        foodName: foodName,
        confidence: 0.90,
        calories: 280,
        protein: 12,
        carbs: 35,
        fats: 10,
        vitamins: ["Vitamin C: 15%", "Vitamin B6: 10%"],
        minerals: ["Calcium: 10%", "Iron: 8%"],
        dietaryFiber: 4,
        healthScore: 78,
        summary: `Estimated profile for traditional "${foodName}". It typically contains a balanced portion of macronutrients, rich in carbohydrates and essential fats.`,
        suitability: {
          recommendation: "EAT",
          reason: `Aligned with your goals. Portions of "${foodName}" fit comfortably into your '${userProfile?.healthGoals || "Stay healthy"}' active health strategy.`
        }
      });
    }

    const targetPref = userProfile ? JSON.stringify(userProfile) : "Healthy Balanced Diet";
    const promptText = `Analyze and estimate the typical nutritional profile for a portion of the food named: "${foodName}".
Provide estimated calories, protein (g), carbohydrates (g), fats (g), dietary fiber (g), major vitamins, and major minerals.
    
Based on the user's details and active preferences: ${targetPref}, compute a health suitability score out of 100, decide whether they should EAT, MODERATE, or AVOID this food, and write a helpful summary explaining the reasons.
Ensure the response complies EXACTLY with the schema specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "Name/Identified dish match" },
            confidence: { type: Type.NUMBER, description: "Confidence score (0.0 to 1.0)" },
            calories: { type: Type.INTEGER, description: "Estimated portion calories in kcal" },
            protein: { type: Type.INTEGER, description: "Estimated portion protein in grams" },
            carbs: { type: Type.INTEGER, description: "Estimated portion carbs in grams" },
            fats: { type: Type.INTEGER, description: "Estimated portion fats in grams" },
            dietaryFiber: { type: Type.INTEGER, description: "Estimated dietary fiber content in grams" },
            vitamins: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Dominant vitamins with daily value %"
            },
            minerals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Dominant minerals with daily value %"
            },
            healthScore: { type: Type.INTEGER, description: "A wellness score from 0 to 100" },
            summary: { type: Type.STRING, description: "Nutritional summary of the food" },
            suitability: {
              type: Type.OBJECT,
              properties: {
                recommendation: { type: Type.STRING, description: "EAT, MODERATE, or AVOID" },
                reason: { type: Type.STRING, description: "Personalized breakdown linked to fitness target" }
              },
              required: ["recommendation", "reason"]
            }
          },
          required: ["foodName", "confidence", "calories", "protein", "carbs", "fats", "vitamins", "minerals", "healthScore", "summary", "suitability"]
        }
      }
    });

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);
    res.json(parsedData);
  } catch (err: any) {
    console.error("Food estimation error:", err);
    res.status(500).json({ error: "Failed to estimate food: " + err.message });
  }
});

// Recipe Suggestion route
app.post("/api/suggest-recipes", async (req, res): Promise<any> => {
  try {
    const { dailyGoal, preference, budgetPref } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Mock healthy recipe response
      return res.json({
        recipes: [
          {
            name: "Lemon Herb Quinoa Salad",
            prepTime: "15 min",
            calories: 340,
            protein: 10,
            carbs: 45,
            fats: 12,
            ingredients: [
              "1 cup cooked quinoa",
              "1/2 cup diced cucumber",
              "1/2 cup cherry tomatoes, halved",
              "2 tbsp fresh lemon juice",
              "1 tbsp extra virgin olive oil",
              "Fresh parsley & mint"
            ],
            instructions: [
              "Combine cooked quinoa, cucumber, and cherry tomatoes in a large mixing bowl.",
              "Whisk together fresh lemon juice and olive oil, then pour over the salad.",
              "Toss gently, garnish with chopped herbs, and serve chilled."
            ]
          },
          {
            name: "Avocado & Egg Breakfast Toast",
            prepTime: "10 min",
            calories: 290,
            protein: 14,
            carbs: 22,
            fats: 16,
            ingredients: [
              "1 slice whole grain bread, toasted",
              "1/2 ripe avocado, mashed",
              "1 large poached egg",
              "Pinch of red pepper flakes",
              "Salt & pepper to taste"
            ],
            instructions: [
              "Toast the whole grain bread until golden brown.",
              "Spread the mashed avocado evenly across the slice.",
              "Top with the warm poached egg.",
              "Season with red pepper flakes, sea salt, and freshly cracked black pepper."
            ]
          },
          {
            name: "Hearty Lentil Soup",
            prepTime: "30 min",
            calories: 410,
            protein: 24,
            carbs: 58,
            fats: 6,
            ingredients: [
              "3/4 cup brown lentils, rinsed",
              "1 small carrot, chopped",
              "1 celery stalk, chopped",
              "2 cups vegetable broth",
              "1/2 white onion, minced",
              "1 tsp garlic powder & cumin"
            ],
            instructions: [
              "Sauté minced onion, chopped carrot, and celery in a pot until softened.",
              "Stir in garlic powder, cumin, lentils, and vegetable broth.",
              "Bring to a boil, then reduce heat to low, cover, and simmer for 25 minutes until lentils are tender."
            ]
          }
        ]
      });
    }

    const targetPrompt = `Suggest exactly 3 healthy, appetizing recipes tailored for a user with calorie goal: ${dailyGoal} kcal and dietary preference: ${preference}. Mention prep time, calories, protein, carbs, fats, ingredients, and step-by-step instructions. Keep recipes distinct and creative.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: targetPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  prepTime: { type: Type.STRING },
                  calories: { type: Type.INTEGER },
                  protein: { type: Type.INTEGER },
                  carbs: { type: Type.INTEGER },
                  fats: { type: Type.INTEGER },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["name", "prepTime", "calories", "protein", "carbs", "fats", "ingredients", "instructions"]
              }
            }
          },
          required: ["recipes"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Recipe suggestion error:", err);
    res.status(500).json({ error: "Failed to generate recipes: " + err.message });
  }
});

// Configure Vite integration for develop and host
async function start() {
  const isProduction = process.env.NODE_ENV === "production" || !process.argv.some(arg => arg.includes("server.ts"));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Food Intelligence server started on http://localhost:${PORT}`);
  });
}

start();
