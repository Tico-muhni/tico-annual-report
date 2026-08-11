import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clients, mortgageReports } from "@/lib/schema";
import type { MortgageComparison, MortgageData } from "@/lib/mortgage-types";

export async function GET(req: NextRequest) {
  const clientIdParam = req.nextUrl.searchParams.get("clientId");
  const db = getDb();
  if (clientIdParam) {
    const clientId = Number(clientIdParam);
    if (!Number.isInteger(clientId)) {
      return NextResponse.json({ error: "מזהה לקוח לא תקין" }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(mortgageReports)
      .where(eq(mortgageReports.clientId, clientId))
      .orderBy(desc(mortgageReports.createdAt));
    return NextResponse.json(rows);
  }
  const rows = await db.select().from(mortgageReports).orderBy(desc(mortgageReports.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const clientId = Number(body.clientId);
  const mortgageData = body.mortgageData as MortgageData | undefined;
  const comparisonData = (body.comparisonData ?? null) as MortgageComparison | null;

  if (!Number.isInteger(clientId)) {
    return NextResponse.json({ error: "מזהה לקוח לא תקין" }, { status: 400 });
  }
  if (!mortgageData || !mortgageData.clientName || !Array.isArray(mortgageData.tracks)) {
    return NextResponse.json({ error: "נתוני משכנתה חסרים או לא תקינים" }, { status: 400 });
  }

  const db = getDb();
  const [existingClient] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!existingClient) {
    return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  }

  const [row] = await db
    .insert(mortgageReports)
    .values({
      clientId,
      clientName: mortgageData.clientName,
      bankName: mortgageData.bankName,
      accountNumber: mortgageData.accountNumber,
      reportDate: mortgageData.payoffDate ?? mortgageData.approvedDate,
      mortgageData,
      comparisonData,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
