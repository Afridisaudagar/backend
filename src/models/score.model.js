import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz"
  },
  name: String,
  score: Number,
  questions: Array
}, {
  strict: false,
  timestamps: true
});

export const Score = mongoose.model("Score", scoreSchema);