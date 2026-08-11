import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { config } from "./schema";
import type { ConfigRow } from "./schema";

/** Returns the singleton config row, creating it on first access. */
export async function ensureConfig(): Promise<ConfigRow> {
  const db = getDb();
  const rows = await db.select().from(config).where(eq(config.id, 1));
  if (rows.length > 0) return rows[0];

  const [row] = await db.insert(config).values({ id: 1 }).onConflictDoNothing().returning();
  if (row) return row;

  const [existing] = await db.select().from(config).where(eq(config.id, 1));
  return existing;
}
