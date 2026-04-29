import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import quizRouter from './routes/quiz.routes.js';
import leaderboardRouter from './routes/leaderboard.routes.js';
import adminRouter from './routes/admin.routes.js';
import wellnessRouter from './routes/wellness.routes.js';
import aiRouter from './routes/ai.routes.js';

const app = express();


app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);



app.use("/api/auth", authRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/wellness", wellnessRouter);
app.use("/api/ai", aiRouter);
     

export default app;
