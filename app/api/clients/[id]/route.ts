import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clients, mortgageReports } from "@/lib/schema";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const db = getDb();
  // Reports reference the client — clear them first (no ON DELETE CASCADE on the FK).
  await db.delete(mortgageReports).where(eq(mortgageReports.clientId, idNum));
  await db.delete(clients).where(eq(clients.id, idNum));

  return NextResponse.json({ ok: true });
}
