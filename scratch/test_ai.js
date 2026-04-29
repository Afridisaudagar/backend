import { Mistral } from "@mistralai/mistralai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: "gemini-pro" });


const extractJson = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    let jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (err) {
    let cleanText = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
    return JSON.parse(cleanText);
  }
};

async function test() {
    const topic = "DevOps";
    const selectedAngle = "Practical Scenarios";
    const skills = "Automation, CI/CD";
    const timestamp = Date.now();
    const randomValue = Math.random();

    const aiPrompt = `
Generate a UNIQUE 10-question quiz session for Antigravity Platform.
TOPIC: "${topic}"
FOCUS ANGLE: "${selectedAngle}"
SKILLS: "${skills}"
SESSION_SEED: ${timestamp}-${randomValue}

STRICT INSTRUCTIONS:
1. Every question must be novel and different from common textbook versions.
2. Use different wording and scenarios.
3. Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "skill": "string",
      "difficulty": "easy|medium|hard"
    }
  ]
}
`;

    let aiResponseText = "";
    try {
        console.log("Trying Mistral...");
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000));
        const mistralPromise = client.chat.complete({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: aiPrompt }],
            temperature: 1.1
        });

        const response = await Promise.race([mistralPromise, timeout]);
        aiResponseText = response.choices[0].message.content;
        console.log("Mistral Succeeded");
    } catch (err) {
        console.warn("Mistral Failed:", err.message);
        console.log("Trying Gemini...");
        const result = await gemini.generateContent(aiPrompt);
        aiResponseText = result.response.text();
        console.log("Gemini Succeeded");
    }

    try {
        const data = extractJson(aiResponseText);
        console.log("Extracted Questions Count:", (data.questions || data).length);
    } catch (parseErr) {
        console.error("Parse Error:", parseErr.message);
        console.log("RAW TEXT:", aiResponseText);
    }
}

test();
