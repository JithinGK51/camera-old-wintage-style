import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// High-fidelity fallback metadata generator for offline/sandboxed development and Gemini API error recovery (e.g., 503 overload)
function getFallbackMetadata(frameStyle?: string) {
  if (frameStyle === "BOUNTY") {
    const bountyFallbacks = [
      {
        title: "Straw Hat",
        scene: "Captain of the Straw Hat Pirates, spotted liberating kingdoms and eating infinite meat.",
        composition: "Threat Class: Emperor of the Sea. Emits immense Conqueror's Haki aura.",
        caption: "Monkey D. Luffy",
        location: "Egghead Island, Grand Line",
        weather: "Haki Storm Overcast",
        suggestedFilter: "Wanted Parchment",
        settings: { aperture: "f/1.4", shutter: "1/500s", iso: "800", lens: "Classic 35mm" }
      },
      {
        title: "Pirate Hunter",
        scene: "First mate and master swordsman, known to carry three swords and get lost instantly.",
        composition: "Threat Class: Commander. Extreme physical cutting prowess detected.",
        caption: "Roronoa Zoro",
        location: "Wano Country, Grand Line",
        weather: "Green Tiger Slashing Aura",
        suggestedFilter: "Wanted Parchment",
        settings: { aperture: "f/1.8", shutter: "1/1000s", iso: "400", lens: "Standard 50mm" }
      },
      {
        title: "Black Leg",
        scene: "Straw Hat cook and deadly martial artist, spotted serving high-grade cuisine.",
        composition: "Threat Class: Wing of the Pirate King. Diable Jambe heat signatures.",
        caption: "Sanji Vinsmoke",
        location: "Whole Cake Island, Grand Line",
        weather: "Fiery Passion Wind",
        suggestedFilter: "Wanted Parchment",
        settings: { aperture: "f/2.0", shutter: "1/250s", iso: "1600", lens: "Fast 85mm" }
      },
      {
        title: "Cat Burglar",
        scene: "Brilliant navigator and cat burglar, holding a clima-tact and forecasting storms.",
        composition: "Threat Class: High Intellect. Controls local meteorological phenomena.",
        caption: "Nami",
        location: "Weatheria, Sky Island",
        weather: "Thunderbolt Breeze",
        suggestedFilter: "Wanted Parchment",
        settings: { aperture: "f/2.8", shutter: "1/125s", iso: "200", lens: "Wide 24mm" }
      },
      {
        title: "Devil Child",
        scene: "Archaeologist seeking the Rio Poneglyph, highly sought by the World Government.",
        composition: "Threat Class: Extreme Threat. Capable of reading ancient scripts.",
        caption: "Nico Robin",
        location: "Ohara, West Blue",
        weather: "Cherry Blossom Petal Rain",
        suggestedFilter: "Wanted Parchment",
        settings: { aperture: "f/1.4", shutter: "1/200s", iso: "640", lens: "Classic 35mm" }
      }
    ];
    return bountyFallbacks[Math.floor(Math.random() * bountyFallbacks.length)];
  }

  // Classic film style fallbacks
  const classicFallbacks = [
    {
      title: "Golden Hour Solitude",
      scene: "Warm light washing over the scene, catching fine dust particles in the air.",
      composition: "Rule of thirds aligned beautifully with soft highlights framing the center subject.",
      caption: "Golden hour reflections, Tokyo '26",
      location: "Shibuya, Tokyo",
      weather: "Warm Sunburst",
      suggestedFilter: "Kodak Gold 200",
      settings: { aperture: "f/2.0", shutter: "1/125s", iso: "200", lens: "Classic 35mm" }
    },
    {
      title: "Monochrome Alleyway",
      scene: "Strong shadows and high contrast, revealing deep silver halide grain textures.",
      composition: "Chiaroscuro lighting with dramatic leading lines emphasizing physical geometry.",
      caption: "Quiet silver textures, Paris '26",
      location: "Montmartre, Paris",
      weather: "Misty Rain",
      suggestedFilter: "Leica Monochrom",
      settings: { aperture: "f/2.8", shutter: "1/60s", iso: "400", lens: "Compact 28mm" }
    },
    {
      title: "Cozy Study Nook",
      scene: "A subtle indoor light cast on wooden furniture with steam rising from a fresh brew.",
      composition: "Intimate close-up framing with beautiful out-of-focus background bokeh circles.",
      caption: "Coffee & quiet moments, '26",
      location: "Seattle, WA",
      weather: "Foggy Overcast",
      suggestedFilter: "Fuji Superia 400",
      settings: { aperture: "f/1.4", shutter: "1/30s", iso: "800", lens: "Portrait 50mm" }
    },
    {
      title: "Suburban Retro Sunset",
      scene: "Vivid cyan and orange hues stretching across the horizon over telephone poles.",
      composition: "Symmetrical horizontal alignment with retro silhouettes cutting through the glow.",
      caption: "Summer night sunset, LA '26",
      location: "Los Angeles, CA",
      weather: "Hazy Twilight",
      suggestedFilter: "Agfa Vista 100",
      settings: { aperture: "f/5.6", shutter: "1/250s", iso: "100", lens: "Classic 35mm" }
    }
  ];
  return classicFallbacks[Math.floor(Math.random() * classicFallbacks.length)];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase body size limit for base64 image uploads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Initialize Gemini AI (Accessed via process.env.GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY || "dummy_key";
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for AI-powered scene analysis & enhancement suggestions
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { imageBase64, frameStyle } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 parameter" });
      }

      // Check if API key is configured or dummy
      if (apiKey === "dummy_key" || !process.env.GEMINI_API_KEY) {
        return res.json(getFallbackMetadata(frameStyle));
      }

      // Extract raw base64 data if it has a prefix (e.g., "data:image/jpeg;base64,...")
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      };

      let promptText = "Analyze this captured image from our Retro Vintage Instant Camera app. Provide realistic, immersive metadata as if the camera was loaded with classic physical film stock. Detect the scene, composition details, estimate weather mood, and write a poetic handwritten caption. Respond in structured JSON matching the requested schema.";

      if (frameStyle === "BOUNTY") {
        promptText = "Analyze this image from our Anime Vintage Bounty Poster App. Act as the Marine Headquarters (from One Piece) issuing a Wanted Bounty Poster for the person/subject depicted in this image. Detect the subject and generate:\n1. A cool pirate title/nickname (e.g., 'Straw Hat', 'Cat Burglar', 'Pirate Hunter') for 'title'.\n2. The full pirate name for 'caption' (e.g., 'Monkey D. Luffy', 'Roronoa Zoro').\n3. A humorous or immersive scene description describing their 'crimes' against the Marines or their majestic pirate presence for 'scene'.\n4. A fun composition description analyzing their pirate power, threat level, or bounty class for 'composition'.\n5. An authentic anime pirate location (e.g., 'East Blue', 'Grand Line', 'Wano Country', 'Water 7', 'Sabaody Archipelago') for 'location'.\n6. The weather mood or aura (e.g., 'Stormy Haki Aura', 'Sunny Grand Line Breeze') for 'weather'.\n7. Film simulation (e.g., 'Wanted Parchment'). Respond in structured JSON matching the requested schema.";
      }

      const promptPart = {
        text: promptText,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, promptPart],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A vintage, nostalgic title/nickname for the photo" },
              scene: { type: Type.STRING, description: "Brief visual description of the main subjects" },
              composition: { type: Type.STRING, description: "A brief, poetic vintage-inspired composition or threat analysis" },
              caption: { type: Type.STRING, description: "A short handwritten caption or pirate name (max 35 chars)" },
              location: { type: Type.STRING, description: "A nostalgic, simulated, matched city/country, or anime pirate location" },
              weather: { type: Type.STRING, description: "Estimated weather mood or aura" },
              suggestedFilter: { type: Type.STRING, description: "Suggested film simulation matching the photo (e.g., 'Kodak Gold 200', 'Wanted Parchment')" },
              settings: {
                type: Type.OBJECT,
                properties: {
                  aperture: { type: Type.STRING, description: "Estimated vintage f-stop (e.g., f/1.8, f/2.8, f/5.6)" },
                  shutter: { type: Type.STRING, description: "Estimated physical shutter speed (e.g., 1/60s, 1/125s, 1/250s)" },
                  iso: { type: Type.STRING, description: "Estimated film speed (e.g., ISO 100, ISO 400, ISO 800)" },
                  lens: { type: Type.STRING, description: "Simulated camera lens focal length (e.g., Classic 35mm, Portrait 50mm, Wide 28mm)" }
                },
                required: ["aperture", "shutter", "iso", "lens"]
              }
            },
            required: ["title", "scene", "composition", "caption", "location", "weather", "suggestedFilter", "settings"]
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.warn("Gemini service encountered an error or high demand (503). Falling back to offline-first development engine:", error);
      const fallback = getFallbackMetadata(req.body.frameStyle);
      res.json(fallback);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
