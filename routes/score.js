import express from "express";
import bodyParser from "body-parser";
import expressValidator from "express-validator";
import * as pg from "../db/pg.js";
import * as redis from "../db/redis.js";
import { submit } from "../controllers/score.js";

const { body, validationResult } = expressValidator;
const { json } = bodyParser;

redis.init();
pg.init();

const promisifiedRedis = redis.getClient();
const pgPool = pg.getClient();

export var scoreRouter = express.Router();
scoreRouter.use(json());

scoreRouter.post(
  "/submit",
  body("score_worth").isFloat(),
  body("user_id").isUUID(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const err = await submit(
      promisifiedRedis,
      pgPool,
      req.body.score_worth,
      req.body.user_id,
      req.body.timestamp
    );

    if (err) {
      return res.status(422).json({ errors: err.stack });
    }

    return res.sendStatus(200);
  }
);
