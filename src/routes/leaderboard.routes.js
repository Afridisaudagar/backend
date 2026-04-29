import express from "express";
import { Score } from "../models/score.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const leaderboard = await Score.aggregate([
      {
        $group: {
          _id: "$user",
          totalScore: { $sum: "$score" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $sort: { totalScore: -1 } },
      { $limit: 20 }
    ]);

    const formatted = leaderboard.map(entry => ({
      ...entry,
      score: entry.totalScore
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;