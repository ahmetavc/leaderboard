export const createUser = async (promisifiedRedis, pgPool, newUser) => {
  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");

    const insertText =
      "INSERT INTO users(id, display_name, score, country, created_at, last_modified) VALUES ($1,$2,$3,$4, $5, $6)";
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

    //add to country based sorted set
    await promisifiedRedis.zadd(newUser.country, newUser.score, newUser.ID);

    //if everything successful, commit
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");

    // if there was a problem, delete from sorted sets too
    await promisifiedRedis.zrem("users", newUser.ID);
    await promisifiedRedis.zrem(newUser.country, newUser.ID);

    return [null, e];
  } finally {
    client.release();
  }

  newUser.rank = await promisifiedRedis.zrevrank("users", newUser.ID);
  newUser.rank += 1; //redis sorted keys are 0-indexed
  return [newUser, null];
};

export const getUser = async (promisifiedRedis, pgPool, userID) => {
  const client = await pgPool.connect();

  const selectText = "SELECT * FROM users WHERE id = $1";
  const selectValues = [userID];
  const res = await client.query(selectText, selectValues);
  const queryResult = res.rows[0];

  let rank = await promisifiedRedis.zrevrank("users", userID);
  rank += 1;

  const user = {};
  user.id = queryResult.id;
  user.country = queryResult.country;
  user.display_name = queryResult.display_name;
  user.score = queryResult.score;
  user.rank = rank;

  return user;
};
