import express from "express";
const router = express.Router();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";
import { IdentiyUser } from "../middleware/auth.middleware.js";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

router.post("/solve-doubt", IdentiyUser, async (req, res) => {
  try {
    const { question, style, isWeakStudent } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required." });
    }

    const prompt = `
      You are a brilliant, patient, and empathetic teacher on the Antigravity AI education platform.
      Your goal is to solve the student's doubt by explaining concepts in a way that truly helps them understand, not just giving the answer.

      Student Question: "${question}"
      Explanation Style: ${style || "English Mode (Formal)"}
      Special Mode: ${isWeakStudent ? "Explain like I'm a weak student (Super simple, foundational, heavy use of analogies)" : "Normal"}

      Instructions:
      1. Provide a step-by-step explanation.
      2. Detect the complexity of the question and simplify it accordingly.
      3. Use clear examples for clarity.
      4. If "Hinglish mode" is requested, use a conversational mix of Hindi (written in English script) and English.
      5. If "Simple mode" is requested, avoid technical jargon as much as possible.
      6. Suggest a visual representation or diagram description if it helps.
      7. Break the answer into small, digestible chunks.
      
      Format the response as a JSON object:
      {
        "title": "A short descriptive title for the solution",
        "explanationSteps": [
          { "step": 1, "content": "..." },
          { "step": 2, "content": "..." }
        ],
        "summary": "Final concise summary of the concept",
        "visualSuggestion": "Description of a diagram or chart that would help",
        "example": "A concrete real-world example",
        "followUp": "A question or suggestion for the student to check their understanding"
      }
    `;

    let aiResponseText = "";
    
    try {
        const mistralRes = await mistralClient.chat.complete({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: prompt }]
        });
        aiResponseText = mistralRes.choices[0].message.content;
    } catch (mistralErr) {
        console.warn("Mistral failed for doubt solver, trying Gemini...");
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const geminiResult = await geminiModel.generateContent(prompt);
        aiResponseText = geminiResult.response.text();
    }
    
    try {
        const jsonMatch = aiResponseText.match(/[\{\[][\s\S]*[\}\]]/);
        if (jsonMatch) {
          res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("No JSON found");
        }
    } catch (parseErr) {
        // Fallback response if AI doesn't return JSON
        res.json({
            title: "Concept Explanation",
            explanationSteps: [{ step: 1, content: aiResponseText }],
            summary: "I've provided a detailed explanation above.",
            visualSuggestion: "A flow chart of the process.",
            example: "Think of it like a chain reaction.",
            followUp: "Does this make sense so far?"
        });
    }

  } catch (error) {
    console.error("DOUBT SOLVER AI ERROR:", error.message);
    res.status(500).json({ message: error.message || "AI calculation failed" });
  }
});

export default router;
