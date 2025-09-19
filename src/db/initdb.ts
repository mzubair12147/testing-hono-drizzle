// // initDb.ts
// import { drizzle } from "drizzle-orm/neon-serverless";
// import { Client } from "@neondatabase/serverless";
// import * as schema from "./schema";
// import { ENV } from "../config/env";

// export async function initDb() {
//   const client = new Client(ENV.DATABASE_URL);
//   await client.connect();
//   return drizzle(client, { schema });
// }
