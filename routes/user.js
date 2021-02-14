import express from "express";
import { v4 as uuidv4 } from "uuid";
import bodyParser from "body-parser";
import expressValidator from "express-validator";
import * as pg from "../db/pg.js";
import * as redis from "../db/redis.js";
import { createBulkOfUsers, createUser, getUser } from "../controllers/user.js";

const { body, validationResult, param } = expressValidator;
const { json } = bodyParser;

redis.init();
pg.init();

const promisifiedRedis = redis.getClient();
const pgPool = pg.getClient();

export var userRouter = express.Router();
userRouter.use(json());

userRouter.get(
  "/profile/:user_id",
  param("user_id").isUUID(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const userID = req.params["user_id"];

    const user = await getUser(promisifiedRedis, pgPool, userID);

    return res.json(user);
  }
);

userRouter.post(
  "/create",
  body("country").isLength({
    min: 2,
    max: 3,
  }),
  body("display_name").isLength({ min: 3 }),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let newUser = {};
    const now = new Date();

    newUser.ID = uuidv4();
    newUser.display_name = req.body.display_name;
    newUser.score = 0;
    newUser.country = req.body.country;
    newUser.created_at = now;
    newUser.last_modified = now;

    const result = await createUser(promisifiedRedis, pgPool, newUser);
    newUser = result[0];

    const err = result[1];

    if (err) {
      return res.status(422).json({ errors: err.stack });
    }

    return res.json({
      user_id: newUser.ID,
      display_name: newUser.display_name,
      score: newUser.score,
      rank: newUser.rank,
    });
  }
);

// insert bulk of users with random scores and country
userRouter.post("/bulk", body("count").isInt(), async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const count = req.body.count;
  const result = await createBulkOfUsers(promisifiedRedis, pgPool, count);

  return res.json(result);
});
