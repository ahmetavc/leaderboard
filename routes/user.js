import express from "express";
import { v4 as uuidv4 } from "uuid";
import { validate as uuidValidate } from "uuid";
import bodyParser from "body-parser";
import expressValidator from "express-validator";
import * as pg from "../db/pg.js";
import * as redis from "../db/redis.js";
import util from "util";
import { createUser, getUser } from "../application/user.js";

const { body, validationResult, query } = expressValidator;
const { json } = bodyParser;
const { promisify } = util;

redis.init();
const redisClient = redis.getClients().cacheInstance;
const promisifiedRedis = {
  zadd: promisify(redisClient.zadd).bind(redisClient),
  hexists: promisify(redisClient.hexists).bind(redisClient),
  hset: promisify(redisClient.hset).bind(redisClient),
  hget: promisify(redisClient.hget).bind(redisClient),
  zrank: promisify(redisClient.zrank).bind(redisClient),
  zrem: promisify(redisClient.zrem).bind(redisClient),
};

pg.init();
const pgPool = pg.getClients().pool;

export var router = express.Router();
router.use(json());

router.get("/profile/:user_id", async function (req, res) {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(422).json({ errors: errors.array() });
  // }

  const userID = req.params["user_id"];

  const user = await getUser(promisifiedRedis, pgPool, userID);

  return res.json(user);
});

router.post(
  "/create",
  body("country").isLength({
    min: 1,
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

// insert bulk of users with random scores
// router.post("/bulk", function (req, res) {
//   const userID = uuidv4();
// });
