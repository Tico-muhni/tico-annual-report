import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

// Singleton row (id always 1) — one advisor, one PIN.
export const config = pgTable("config", {
  id: serial("id").primaryKey(),
  // null = still using the APP_PIN env var; set once the PIN is changed in-app
  pinHash: text("pin_hash"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// A client whose mortgage is tracked over time (separate from any deal
// pipeline — this app is for post-close relationship management).
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// One mortgage snapshot for a client — the advisor reads the client's אישור
// עקרוני (approved terms) and יתרות לסילוק (current payoff statement), e.g.
// by pasting them into a Claude conversation, and enters the resulting
// numbers here through the report form (see lib/mortgage-types.ts).
export const mortgageReports = pgTable("mortgage_reports", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  clientName: text("client_name"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  reportDate: text("report_date"), // as printed on the source PDFs (DD/MM/YYYY)
  // MortgageData (lib/mortgage-types.ts) — one track per loan, approved
  // terms matched against actual terms.
  mortgageData: jsonb("mortgage_data"),
  comparisonData: jsonb("comparison_data"), // from a SMARTNPV-style השוואת תמהילים report (optional, added later)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ConfigRow = typeof config.$inferSelect;
export type ClientRow = typeof clients.$inferSelect;
export type NewClientRow = typeof clients.$inferInsert;
export type MortgageReportRow = typeof mortgageReports.$inferSelect;
export type NewMortgageReportRow = typeof mortgageReports.$inferInsert;
