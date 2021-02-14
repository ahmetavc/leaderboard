export const submit = async (
  promisifiedRedis,
  pgPool,
  score,
  userId,
  timestamp
) => {
  const client = await pgPool.connect();

  let date;
  let currentScore;
  let country;

  try {
    const ts = parseFloat(timestamp);
    date = new Date(ts);

    const selectText = "SELECT country, score FROM users WHERE id = $1";
    const selectValues = [userId];
    const res = await client.query(selectText, selectValues);
    country = res.rows[0].country;
    currentScore = res.rows[0].score;

    currentScore = parseFloat(currentScore);
    score = parseFloat(score);
  } catch (e) {
    return e;
  }

  try {
    await client.query("BEGIN");

    const updateText =
      "UPDATE users SET score = $1, last_modified = $2 WHERE id = $3";
    const updateValues = [currentScore + score, date, userId];
    await client.query(updateText, updateValues);

    //update in redis sorted sets too
    await promisifiedRedis.zadd("users", currentScore + score, userId);

    await promisifiedRedis.zadd(country, currentScore + score, userId);

    //if everything successful, commit
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");

    await promisifiedRedis.zadd("users", currentScore, userId);
    await promisifiedRedis.zadd(country, currentScore, userId);

    return e;
  } finally {
    client.release();
  }
};
