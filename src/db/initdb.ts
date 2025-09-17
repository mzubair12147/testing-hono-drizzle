// initDb.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Client } from "@neondatabase/serverless";
import * as schema from "./schema";
import { ENV } from "../config/env";

export async function initDb() {
  const client = new Client(ENV.DATABASE_URL); // ✅ NeonClient
  await client.connect();                      // must connect
  return drizzle(client, { schema });          // works with neon-serverless
}
