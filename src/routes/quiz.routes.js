import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();

import { Quiz } from "../models/quiz.model.js";
import { Score } from "../models/score.model.js";
import { User } from "../models/user.model.js";
import { IdentiyUser } from "../middleware/auth.middleware.js";

import { Mistral } from "@mistralai/mistralai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper to extract JSON from AI response strings
const extractJson = (text) => {
  try {
    const jsonMatch = text.match(/[\{\[][\s\S]*[\}\]]/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    let jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("JSON PARSE ERROR:", err.message);
    let cleanText = text
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();
    try {
      return JSON.parse(cleanText);
    } catch (innerErr) {
       throw new Error("Could not parse AI response as JSON");
    }
  }
};


// AI GENERATE QUIZ
router.post("/generate", IdentiyUser, async (req, res) => {
  try {
    const { prompt, skills, timeLimit, isDynamic = true } = req.body;
    
    if (isDynamic) {
        const quiz = await Quiz.create({
          subject: prompt,
          questions: [],
          timeLimit: timeLimit || 30,
          createdBy: req.user.id,
          isDynamic: true,
          targetSkills: skills || "general knowledge, technical concepts"
        });
        return res.json(quiz);
    }

    const sessionSeed = `${Math.random().toString(36).substring(7)}-${Date.now()}`;

    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `You are an advanced AI quiz generator for a premium AI education platform called "Antigravity". Your task is to generate a UNIQUE and NON-REPETITIVE quiz every time, even if the same topic is requested multiple times.`
        },
        {
          role: "user",
          content: `
            IMPORTANT RULES (STRICT):
            1. Topic: Generate questions ONLY from this topic: "${prompt}"
            2. Skills: Questions must test these skills: "${skills || "general knowledge, technical concepts, problem solving"}"
            3. Uniqueness (VERY IMPORTANT): Seed: ${sessionSeed}
            4. Output Format (STRICT JSON ONLY): { "questions": [...] }
            5. Count: exactly 10 questions.`
        }
      ]
    });

    let text = response.choices[0].message.content;
    const data = extractJson(text);
    let questions = data.questions ? data.questions : data;

    const formattedQuestions = questions.map(q => ({
      question: q.question,
      options: q.options,
      answer: q.correctAnswer || q.answer,
      skill: q.skill || "knowledge",
      difficulty: q.difficulty || "medium"
    }));

    const quiz = await Quiz.create({
      subject: prompt,
      questions: formattedQuestions.slice(0, 10),
      timeLimit: timeLimit || 30,
      createdBy: req.user.id,
      isDynamic: false,
      targetSkills: skills
    });

    res.json(quiz);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's own scores
router.get("/my-scores", IdentiyUser, async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: "Error fetching my scores" });
  }
});

// Submit score
router.post("/submit", IdentiyUser, async (req, res) => {
  try {
    const { score, quizId, questions } = req.body;
    const newScore = await Score.create({
      user: req.user.id,
      quiz: quizId,
      score,
      questions 
    });
    res.json(newScore);
  } catch (err) {
    res.status(500).json({ message: "Error saving score" });
  }
});

// ADMIN CREATE CUSTOM QUIZ
router.post("/create", IdentiyUser, async (req, res) => {
  try {
    const { subject, questions } = req.body;
    const quiz = await Quiz.create({ subject, questions });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Error creating quiz" });
  }
});

// GET ALL QUIZZES
router.get("/all", IdentiyUser, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching quizzes" });
  }
});

// DELETE QUIZ
router.delete("/:id", IdentiyUser, async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: "Quiz Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting quiz" });
  }
});

// STUDENT FETCH ALL QUIZZES
router.get("/student/all", IdentiyUser, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching quizzes" });
  }
});

router.get("/:id", IdentiyUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const isAiCompatible = quiz.subject && (quiz.isDynamic || quiz.questions.length <= 10);
    
    if (isAiCompatible) {
      const aiPrompt = `Generate a UNIQUE 10-question quiz session for Topic: "${quiz.subject}". Return JSON only.`;
      
      let aiResponseText = "";
      try {
          const response = await client.chat.complete({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: aiPrompt }]
          });
          aiResponseText = response.choices[0].message.content;
      } catch (mistralErr) {
          let geminiModelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
          const geminiResult = await geminiModelInstance.generateContent(aiPrompt);
          aiResponseText = geminiResult.response.text();
      }

      const data = extractJson(aiResponseText);
      const questions = data.questions ? data.questions : data;

      const formattedQuestions = questions.map(q => ({
        question: q.question,
        options: q.options,
        answer: q.correctAnswer || q.answer,
        skill: q.skill || "knowledge",
        difficulty: q.difficulty || "medium"
      }));

      return res.json({
        _id: quiz._id,
        subject: quiz.subject,
        timeLimit: quiz.timeLimit,
        questions: formattedQuestions.slice(0, 10),
        isDynamic: true
      });
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Error fetching quiz" });
  }
});

// BOSS BATTLE GENERATION
router.post("/boss-battle/generate", IdentiyUser, async (req, res) => {
  try {
    const topics = ["Full Stack Development", "System Architecture", "Advanced Algorithms", "Cybersecurity Essentials", "AI & Machine Learning"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const aiPrompt = `Generate a BRUTAL HARD 10-question quiz for "${randomTopic}". Return JSON only.`;

    let aiResponseText = "";
    try {
        const response = await client.chat.complete({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: aiPrompt }]
        });
        aiResponseText = response.choices[0].message.content;
    } catch (err) {
        let geminiModelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await geminiModelInstance.generateContent(aiPrompt);
        aiResponseText = result.response.text();
    }

    const data = extractJson(aiResponseText);
    const questions = data.questions ? data.questions : data;

    const formattedQuestions = questions.map(q => ({
        question: q.question,
        options: q.options,
        answer: q.correctAnswer || q.answer,
        skill: q.skill || "Hard",
        difficulty: "hard"
    }));

    const quiz = await Quiz.create({
        subject: `BOSS BATTLE: ${randomTopic}`,
        questions: formattedQuestions.slice(0, 10),
        timeLimit: 5,
        createdBy: req.user.id,
        isDynamic: false
    });

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Boss is sleeping. Try again later." });
  }
});

// CLAIM BOSS BATTLE BADGE
router.post("/boss-battle/claim", IdentiyUser, async (req, res) => {
  try {
    const { score } = req.body;
    if (score < 70) return res.status(400).json({ message: "Score too low." });

    const user = await User.findById(req.user.id);
    const today = new Date().toDateString();
    
    user.badges.push({ name: "🏆 Daily Warrior Badge", date: new Date(), icon: "🏆" });
    user.lastBossBattleDate = new Date();
    await user.save();

    res.json({ message: "Badge claimed!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to claim badge." });
  }
});

// GET USER BADGES
router.get("/user/badges", IdentiyUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ badges: user.badges || [], streak: user.streak || 0 });
    } catch (err) {
        res.status(500).json({ message: "Error fetching badges" });
    }
});

// GENERATE ROADMAP
router.post("/roadmap/generate", IdentiyUser, async (req, res) => {
    try {
        const { goal } = req.body;
        const prompt = `
            You are a strategic coach for Antigravity. Goal: "${goal}".
            Provide a 3-month strategy: 
            1. 3 Monthly Milestones.
            2. Weekly breakdown for month 1 (4 weeks).
            3. Quiz Strategy: topics to practice on our platform.
            Respond in Hinglish. JSON Format:
            {
                "title": "string",
                "milestones": ["string", "string", "string"],
                "weeklyPlan": [{"week": 1, "topic": "string", "task": "string"}, ...],
                "quizStrategy": "string"
            }
        `;

        let aiResponseText = "";
        try {
            const mistralRes = await client.chat.complete({ model: "mistral-small-latest", messages: [{ role: "user", content: prompt }] });
            aiResponseText = mistralRes.choices[0].message.content;
        } catch (err) {
            let geminiModelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const result = await geminiModelInstance.generateContent(prompt);
            aiResponseText = result.response.text();
        }

        const data = extractJson(aiResponseText);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Failed to generate roadmap." });
    }
});

export default router;