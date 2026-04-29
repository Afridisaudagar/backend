import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      default: "General"
    },
    questions: [
      {
        question: String,
        options: [String],
        answer: String,
        skill: String,
        difficulty: String
      },
    ],
    timeLimit: {
      type: Number,
      default: 30
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isDynamic: {
      type: Boolean,
      default: false
    },
    targetSkills: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export const Quiz = mongoose.model("Quiz", quizSchema);