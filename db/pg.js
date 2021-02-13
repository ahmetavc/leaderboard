import pg from "pg";
import { URL } from "url";
const clients = {};

export const init = () => {
  const params = new URL(process.env.DATABASE_URL);

  const config = {
    user: params.username,
    password: params.password,
    host: params.hostname,
    port: params.port,
    database: params.pathname.split("/")[1],
    ssl: { rejectUnauthorized: false },
  };

  clients.pool = new pg.Pool(config);
};

export const getClients = () => clients;
