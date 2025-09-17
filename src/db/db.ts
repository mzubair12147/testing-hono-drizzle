// Old: Node Postgres driver (for local or traditional server environments)
// import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";
// import * as schema from "./schema";
// import { ENV } from "../config/env";

// const pool = new Pool({
//     connectionString: ENV.DATABASE_URL,
// });

// export const db = drizzle(pool, { schema });
// export type Db = typeof db;
// export { pool };


// New: Neon HTTP driver (for serverless)
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { ENV } from '../config/env';

const sql = neon(ENV.DATABASE_URL);
export const db = drizzle(sql, { schema });
export type Db = typeof db;


// src/db/db.ts
// import { drizzle } from "drizzle-orm/neon-serverless";
// import { Client } from "@neondatabase/serverless";
// import * as schema from "./schema";
// import { ENV } from "../config/env";

// const client = new Client(ENV.DATABASE_URL);
// await client.connect(); // connect once at startup

// export const db = drizzle(client, { schema });
// export type Db = typeof db;




