import express from "express";
const router = express.Router();

import { User } from "../models/user.model.js";
import { Score } from "../models/score.model.js";
import { IdentiyUser } from "../middleware/auth.middleware.js";



const isAdmin = (req, res, next) => {
  // console.log("REQ.USER =>", req.user); 

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json("Admin access only");
  }

  next();
};

// get all users
// API: /api/admin/users
router.get("/users", IdentiyUser, isAdmin, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// delete user
// API: /api/admin/user/:id
router.delete("/user/:id", IdentiyUser, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json("User Deleted");
});

// reset leaderboard
// API: /api/admin/reset
router.delete("/reset", IdentiyUser, isAdmin, async (req, res) => {
  await Score.deleteMany();
  res.json("Leaderboard Reset");
});

export default router;