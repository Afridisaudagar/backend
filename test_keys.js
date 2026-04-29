
import dotenv from "dotenv";
dotenv.config();
import { Mistral } from "@mistralai/mistralai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function testMistral() {
    console.log("Testing Mistral...");
    try {
        const response = await mistralClient.chat.complete({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: "Say hello" }],
        });
        console.log("Mistral Success:", response.choices[0].message.content);
    } catch (err) {
        console.error("Mistral Failed:", err.message);
    }
}

async function testGemini() {
    const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
    for (const modelName of models) {
        console.log(`Testing Gemini model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            console.log(`Gemini ${modelName} Success:`, result.response.text());
            return; // Stop if one works
        } catch (err) {
            console.error(`Gemini ${modelName} Failed:`, err.message);
        }
    }
}

testMistral().then(() => testGemini());
