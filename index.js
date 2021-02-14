import express from "express";
import { userRouter } from "./routes/user.js";
import { scoreRouter } from "./routes/score.js";
import { leaderboardRouter } from "./routes/leaderboard.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/user", userRouter);
app.use("/score", scoreRouter);
app.use("/leaderboard", leaderboardRouter);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.setTimeout(10000 * 1000);
