import express from "express";
import bodyParser from "body-parser";
import expressValidator from "express-validator";
import * as pg from "../db/pg.js";
import * as redis from "../db/redis.js";
import {
  getLeaderboard,
  getLeaderboardByCountry,
} from "../controllers/leaderboard.js";

const { validationResult, param } = expressValidator;
const { json } = bodyParser;

redis.init();
pg.init();

const promisifiedRedis = redis.getClient();
const pgPool = pg.getClient();

export var leaderboardRouter = express.Router();
leaderboardRouter.use(json());

leaderboardRouter.get("/", async function (req, res) {
  const result = await getLeaderboard(promisifiedRedis, pgPool);
  return res.json(result);
});

leaderboardRouter.get(
  "/:country_iso",
  param("country_iso").isLength({
    min: 1,
    max: 3,
  }),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const result = await getLeaderboardByCountry(
      promisifiedRedis,
      pgPool,
      req.params["country_iso"]
    );

    return res.json(result);
  }
);
