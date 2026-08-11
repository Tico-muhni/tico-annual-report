import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clients } from "@/lib/schema";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(clients).orderBy(desc(clients.updatedAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, phone, email, note } = body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "שם הלקוח הוא שדה חובה" }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .insert(clients)
    .values({
      name: name.trim().slice(0, 200),
      phone: phone ? String(phone).slice(0, 50) : null,
      email: email ? String(email).slice(0, 200) : null,
      note: note ? String(note).slice(0, 1000) : null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
