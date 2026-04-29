      import mongoose from "mongoose";

  const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    badges: [
      {
        name: String,
        date: { type: Date, default: Date.now },
        icon: String,
      }
    ],
    streak: { type: Number, default: 0 },
    lastBossBattleDate: { type: Date }
  });

  export const User = mongoose.model("User", userSchema);
