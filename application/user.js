export const createUser = async (promisifiedRedis, pgPool, newUser) => {
  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");
    const insertText =
      "INSERT INTO users(id, display_name, score, contry, created_at, last_modified) VALUES ($1,$2,$3,$4, $5, $6)";
    const insertValues = [
      newUser.ID,
      newUser.display_name,
      newUser.score,
      newUser.country,
      newUser.created_at,
      newUser.last_modified,
    ];
    await client.query(insertText, insertValues);

    //add to redis sorted set
    await promisifiedRedis.zadd("users", newUser.score, newUser.ID);

    //add to country hash set
    if (await promisifiedRedis.hexists("countries", newUser.country)) {
      let userIDs = promisifiedRedis.hget("countries", newUser.country);
      userIDs = userIDs + "," + newUser.ID;
      await promisifiedRedis.hset("countries", newUser.country, userIDs);
    } else {
      await promisifiedRedis.hset(
        "countries",
        newUser.country,
        newUser.country
      );
    }

    //if everything successful, commit
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");

    await promisifiedRedis.zrem("users", newUser.id);

    //delete the user id from countries hashset
    if (await promisifiedRedis.hexists("countries", newUser.country)) {
      let userIDs = promisifiedRedis.hget("countries", newUser.country);
      let lastIndexOfComma = userIDs.lastIndexOf(",");
      let lastUserID = userIDs.slice(lastIndexOfComma + 1);

      if (lastUserID === newUser.ID) {
        await promisifiedRedis.hset(
          "countries",
          newUser.country,
          userIDs.slice(0, lastIndexOfComma)
        );
      }
    }

    return [null, e];
  } finally {
    client.release();
  }

  newUser.rank = await promisifiedRedis.zrank("users", newUser.ID);
  return [newUser, null];
};

export const getUser = async (promisifiedRedis, pgPool, userID) => {
  const client = await pgPool.connect();

  const selectText = "SELECT * FROM users WHERE id = $1";
  const selectValues = [userID];
  const res = await client.query(selectText, selectValues);
  const queryResult = res.rows[0];

  const rank = await promisifiedRedis.zrank("users", userID);

  const user = {};
  user.id = queryResult.id;
  user.display_name = queryResult.display_name;
  user.score = queryResult.score;
  user.rank = rank;

  return user;
};
