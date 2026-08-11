import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { mortgageReports } from "@/lib/schema";
import type { MortgageComparison, MortgageData } from "@/lib/mortgage-types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }
  const db = getDb();
  const [row] = await db.select().from(mortgageReports).where(eq(mortgageReports.id, idNum));
  if (!row) {
    return NextResponse.json({ error: "דוח לא נמצא" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const mortgageData = body?.mortgageData as MortgageData | undefined;
  const comparisonData = (body?.comparisonData ?? null) as MortgageComparison | null;
  if (!mortgageData || !mortgageData.clientName || !Array.isArray(mortgageData.tracks)) {
    return NextResponse.json({ error: "נתוני משכנתה חסרים או לא תקינים" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select().from(mortgageReports).where(eq(mortgageReports.id, idNum));
  if (!existing) {
    return NextResponse.json({ error: "דוח לא נמצא" }, { status: 404 });
  }

  const [row] = await db
    .update(mortgageReports)
    .set({
      clientName: mortgageData.clientName,
      bankName: mortgageData.bankName,
      accountNumber: mortgageData.accountNumber,
      reportDate: mortgageData.payoffDate ?? mortgageData.approvedDate,
      mortgageData,
      comparisonData,
      updatedAt: new Date(),
    })
    .where(eq(mortgageReports.id, idNum))
    .returning();

  return NextResponse.json(row);
}

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
  await db.delete(mortgageReports).where(eq(mortgageReports.id, idNum));
  return NextResponse.json({ ok: true });
}
