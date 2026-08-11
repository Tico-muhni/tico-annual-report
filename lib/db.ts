import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

// Lazy singleton: DATABASE_URL is only read when a request actually needs
// the database, never at module-evaluation / build time.
export function getDb() {
  if (!global.__drizzleDb) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    const isLocal = /localhost|127\.0\.0\.1/.test(url);
    global.__pgClient = postgres(url, {
      ssl: isLocal ? false : "require",
      max: 1,
    });
    global.__drizzleDb = drizzle(global.__pgClient, { schema });
  }
  return global.__drizzleDb;
}
