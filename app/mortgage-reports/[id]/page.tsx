import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { mortgageReports } from "@/lib/schema";
import type { MortgageComparison, MortgageData } from "@/lib/mortgage-types";
import MortgageReportView from "./MortgageReportView";

export const dynamic = "force-dynamic";

export default async function MortgageReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) notFound();

  const db = getDb();
  const [row] = await db.select().from(mortgageReports).where(eq(mortgageReports.id, idNum));
  if (!row || !row.mortgageData) notFound();

  return (
    <MortgageReportView
      reportId={row.id}
      data={row.mortgageData as MortgageData}
      comparison={row.comparisonData as MortgageComparison | null}
      clientDisplayName={row.clientName ?? "לקוח"}
      reportDate={row.reportDate}
    />
  );
}
