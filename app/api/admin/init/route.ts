import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

// One-time setup route (protected by the same login as the rest of the app
// via proxy.ts) — creates the tables if they don't exist yet.
export async function GET() {
  const db = getDb();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS config (
      id serial PRIMARY KEY,
      pin_hash text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS clients (
      id serial PRIMARY KEY,
      name text NOT NULL,
      phone text,
      email text,
      note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mortgage_reports (
      id serial PRIMARY KEY,
      client_id integer NOT NULL REFERENCES clients(id),
      client_name text,
      bank_name text,
      account_number text,
      report_date text,
      mortgage_data jsonb,
      comparison_data jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  return NextResponse.json({ ok: true, message: "הטבלאות מוכנות." });
}
