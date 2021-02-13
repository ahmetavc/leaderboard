import redis from "redis";
import _ from "lodash";
import Promise from "bluebird";

const clients = {};
let connectionTimeout;

export const init = () => {
  console.log("ENV VARIABLE: ", process.env.REDISCLOUD_URL);
  const cacheInstance = redis.createClient(process.env.REDISCLOUD_URL);
  clients.cacheInstance = cacheInstance;
  instanceEventListeners({ conn: cacheInstance });
};
export const getClients = () => clients;
export const closeConnections = () => _.forOwn(clients, (conn) => conn.quit());

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
