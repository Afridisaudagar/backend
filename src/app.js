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
    origin: (origin, callback) => {
      // Allow all origins for now to fix deployment issues
      callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);



app.use("/api/auth", authRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/wellness", wellnessRouter);
app.use("/api/ai", aiRouter);

app.get("/", (req, res) => {
  res.json({ message: "AI Education Backend is running!" });
});
     

export default app;
