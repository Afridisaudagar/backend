import express from "express";
const router = express.Router();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";
import { IdentiyUser } from "../middleware/auth.middleware.js";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

router.post("/advice", IdentiyUser, async (req, res) => {
  try {
    const { mood, sleep, mindset, goal } = req.body;

    const prompt = `
      You are a compassionate student wellness counselor for the Antigravity learning platform.
      A student has provided the following assessment of their current state:
      - Current Mood: ${mood}
      - Sleep last night: ${sleep}
      - Mindset/Current thoughts: "${mindset || "Not specified"}"
      - Today's goal: "${goal || "Not specified"}"

      Please provide:
      1. A brief, empathetic analysis of their situation.
      2. 3-4 specific, actionable recommendations (Aap yeh kro) to help them stay focused and mentally healthy today.
      
      Respond in a professional yet friendly mix of English and Roman Urdu (Hinglish/Urdu-English).
      Format the response as a JSON object:
      {
        "analysis": "string",
        "recommendations": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]
      }
    `;

    let aiResponseText = "";
    
    try {
        // Try Mistral first (matching quiz.routes logic)
        const mistralRes = await mistralClient.chat.complete({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: prompt }]
        });
        aiResponseText = mistralRes.choices[0].message.content;
    } catch (mistralErr) {
        console.warn("Mistral failed for wellness, trying Gemini...");
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const geminiResult = await geminiModel.generateContent(prompt);
        aiResponseText = geminiResult.response.text();
    }
    
    // Improved JSON extraction
    try {
        const jsonMatch = aiResponseText.match(/[\{\[][\s\S]*[\}\]]/);
        if (jsonMatch) {
          res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("No JSON found");
        }
    } catch (parseErr) {
        res.json({
            analysis: aiResponseText.split("\n")[0] || "I've analyzed your situation.",
            recommendations: [
                "Take a 10-minute break to clear your head.",
                "Ensure you're staying hydrated as you work.",
                "Focus on the most important part of your goal first.",
                "Don't be too hard on yourself today!"
            ]
        });
    }

  } catch (error) {
    console.error("WELLNESS AI ERROR:", error.message);
    res.status(500).json({ message: error.message || "AI calculation failed" });
  }
});

export default router;
