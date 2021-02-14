import pg from "pg";
import { URL } from "url";
let pool;

export const init = () => {
  if (!pool) {
    const params = new URL(process.env.DATABASE_URL);

    const config = {
      user: params.username,
      password: params.password,
      host: params.hostname,
      port: params.port,
      database: params.pathname.split("/")[1],
      ssl: { rejectUnauthorized: false },
    };

    pool = new pg.Pool(config);
  }
};

export const getClient = () => pool;
