import redis from "redis";
import util from "util";
const { promisify } = util;

let redisClient;
let connectionTimeout;

export const init = () => {
  if (!redisClient) {
    console.log("ENV VARIABLE: ", process.env.REDISCLOUD_URL);
    redisClient = redis.createClient(process.env.REDISCLOUD_URL);
    instanceEventListeners({ conn: redisClient });

    redisClient = {
      zadd: promisify(redisClient.zadd).bind(redisClient),
      hexists: promisify(redisClient.hexists).bind(redisClient),
      hset: promisify(redisClient.hset).bind(redisClient),
      hget: promisify(redisClient.hget).bind(redisClient),
      zrevrank: promisify(redisClient.zrevrank).bind(redisClient),
      zrem: promisify(redisClient.zrem).bind(redisClient),
      zscore: promisify(redisClient.zscore).bind(redisClient),
      flushdb: promisify(redisClient.flushdb).bind(redisClient),
      zrevrange: promisify(redisClient.zrevrange).bind(redisClient),
    };
  }
};
export const getClient = () => redisClient;

function throwTimeoutError() {
  connectionTimeout = setTimeout(() => {
    throw new Error("Redis connection failed");
  }, 10000);
}

function instanceEventListeners({ conn }) {
  conn.on("connect", () => {
    console.log("CacheStore - Connection status: connected");
    clearTimeout(connectionTimeout);
  });
  conn.on("end", () => {
    console.log("CacheStore - Connection status: disconnected");
    throwTimeoutError();
  });
  conn.on("reconnecting", () => {
    console.log("CacheStore - Connection status: reconnecting");
    clearTimeout(connectionTimeout);
  });
  conn.on("error", (err) => {
    console.log("CacheStore - Connection status: error ", { err });
    throwTimeoutError();
  });
}
