export const getLeaderboard = async (promisifiedRedis, pgPool, range = 10) => {
  const client = await pgPool.connect();

  const leaderboardWithIDs = await promisifiedRedis.zrevrange(
    "users",
    0,
    range
  );

  const leaderboard = [];
  let rank = 1;

  for (const id of leaderboardWithIDs) {
    const selectText = "SELECT * FROM users WHERE id = $1";
    const selectValues = [id];
    const res = await client.query(selectText, selectValues);
    const user = {};
    user.rank = rank;
    user.score = res.rows[0].score;
    user.display_name = res.rows[0].display_name;
    user.country = res.rows[0].country;

    leaderboard.push(user);

    rank += 1;
  }

  return leaderboard;
};

export const getLeaderboardByCountry = async (
  promisifiedRedis,
  pgPool,
  country,
  range = 10
) => {
  const client = await pgPool.connect();

  const leaderboardWithIDs = await promisifiedRedis.zrevrange(
    country,
    0,
    range
  );

  const leaderboard = [];

  for (const id of leaderboardWithIDs) {
    const selectText = "SELECT * FROM users WHERE id = $1";
    const selectValues = [id];
    const res = await client.query(selectText, selectValues);
    const user = {};

    user.rank = await promisifiedRedis.zrevrank("users", id);
    user.rank += 1;
    user.score = res.rows[0].score;
    user.display_name = res.rows[0].display_name;
    user.country = res.rows[0].country;

    leaderboard.push(user);
  }

  return leaderboard;
};
