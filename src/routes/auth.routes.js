import express from "express";
const authRouter = express.Router();

import { registerUser, loginUser, getProfile } from "../controllers/auth.controller.js";
import { IdentityUser } from "../middleware/auth.middleware.js";

// registration api
// API is /api/auth/register
authRouter.post("/register", registerUser);

// login api
// API is /api/auth/login
authRouter.post("/login", loginUser);

// profile api
authRouter.get("/me", IdentityUser, getProfile);

export default authRouter;