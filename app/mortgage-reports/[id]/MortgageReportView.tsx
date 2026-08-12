"use client";

import type { MortgageComparison, MortgageData, MortgageTrack } from "@/lib/mortgage-types";
import styles from "./report.module.css";

function parseDMY(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const year = y.length === 2 ? Number(y) + 2000 : Number(y);
  return new Date(year, Number(mo) - 1, Number(d));
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString("he-IL")} ₪`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toFixed(2)}%`;
}

function trackLabel(t: MortgageTrack): string {
  const rate = t.rateType === "fixed" ? "קבועה" : "משתנה";
  const link = t.linkage === "linked" ? "צמודה מדד" : "לא צמודה";
  return t.trackName || `${rate} ${link}`;
}

function sum(tracks: MortgageTrack[], key: keyof MortgageTrack): number | null {
  const vals = tracks.map((t) => t[key]).filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0);
}

export default function MortgageReportView({
  reportId,
  data,
  comparison,
  clientDisplayName,
  reportDate,
}: {
  reportId: number;
  data: MortgageData;
  comparison: MortgageComparison | null;
  clientDisplayName: string;
  reportDate: string | null;
}) {
  const tracks = data.tracks;

  const currentMonthly = data.totalCurrentMonthlyPayment ?? sum(tracks, "currentMonthlyPayment");
  const approvedMonthly = data.totalApprovedMonthlyPayment;
  const currentBalance = data.totalCurrentBalance ?? sum(tracks, "currentPrincipalBalance");
  const actualAmount = data.totalActualAmount ?? sum(tracks, "actualAmount");
  const approvedAmount = data.totalApprovedAmount ?? sum(tracks, "approvedAmount");

  const monthlyDiff =
    approvedMonthly != null && currentMonthly != null ? Math.round(currentMonthly - approvedMonthly) : null;

  // Draws grouped by date, chronological.
  const draws = new Map<string, MortgageTrack[]>();
  for (const t of tracks) {
    if (!t.drawDate) continue;
    const list = draws.get(t.drawDate) ?? [];
    list.push(t);
    draws.set(t.drawDate, list);
  }
  const drawEntries = [...draws.entries()].sort((a, b) => {
    const da = parseDMY(a[0])?.getTime() ?? 0;
    const db = parseDMY(b[0])?.getTime() ?? 0;
    return da - db;
  });

  // Upcoming rate-change dates, chronological, future-looking info only.
  const upcoming = tracks
    .filter((t) => t.nextRateChangeDate)
    .sort((a, b) => (parseDMY(a.nextRateChangeDate)?.getTime() ?? 0) - (parseDMY(b.nextRateChangeDate)?.getTime() ?? 0));

  return (
    <div className={styles.doc}>
      <div className={styles.actions + " " + styles.noPrint}>
        <a className="btn ghost" href={`/mortgage-reports?editId=${reportId}`}>עריכה</a>
        <button className="btn ghost" onClick={() => window.print()}>הפק PDF (הדפסה)</button>
      </div>

      <header className={styles.letterhead}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.brandMark} src="/logo.png" alt="TICO FINANCE — אדריכל המשכנתאות" />
        <div className={styles.docMeta}>
          <div><strong>עבור:</strong> {clientDisplayName}</div>
          {reportDate && <div><strong>תאריך:</strong> {reportDate}</div>}
          {data.accountNumber && <div><strong>חשבון משכנתא:</strong> {data.accountNumber}</div>}
        </div>
      </header>

      <div className={styles.titleBlock}>
        <div className={styles.eyebrow}>דוח סקירה שנתי</div>
        <h1 className={styles.title}>המשכנתה שלכם — מה קרה בפועל</h1>
        <p className={styles.subtitle}>
          סקירה של ההתפתחות מאז לקיחת המשכנתה, בהשוואה בין התנאים שאושרו מראש לבין מה שסגרתם בפועל בכל מסלול.
        </p>
      </div>

      <section className={styles.section} style={{ marginTop: 8 }}>
        <div className={styles.sectionHead}>
          <h2>המצב שלכם היום</h2>
        </div>
        <div className={styles.todayGrid}>
          <div className={styles.todayCard}>
            <div className={styles.k}>יתרת קרן</div>
            <div className={styles.v}>{fmtMoney(currentBalance)}</div>
          </div>
          <div className={styles.todayCard}>
            <div className={styles.k}>החזר חודשי נוכחי</div>
            <div className={styles.v}>{fmtMoney(currentMonthly)}</div>
          </div>
          <div className={styles.todayCard}>
            <div className={styles.k}>מסלולים פעילים</div>
            <div className={styles.v}>{tracks.length}</div>
          </div>
          <div className={styles.todayCard}>
            <div className={styles.k}>עדכון ריבית קרוב הבא</div>
            <div className={styles.v}>{upcoming[0]?.nextRateChangeDate ?? "—"}</div>
          </div>
        </div>
      </section>

      {approvedMonthly != null && currentMonthly != null && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>השוואה לתכנון המקורי</h2>
          </div>
          <div className={styles.heroGrid}>
            <div className={styles.heroMain}>
              <div className={styles.heroLabel}>ההחזר החודשי שלכם היום, לעומת התכנון המקורי</div>
              <div className={styles.heroNumber}>
                {monthlyDiff! > 0 ? "+" : ""}{monthlyDiff}
                <span className={styles.unit}>₪ לחודש</span>
              </div>
              <div className={styles.heroSub}>
                {fmtMoney(approvedMonthly)} אושרו מראש ← {fmtMoney(currentMonthly)} ההחזר בפועל כיום.
              </div>
            </div>
            <div className={styles.heroStats}>
              {actualAmount != null && (
                <div className={styles.statCard}>
                  <div className={styles.k}>סה&quot;כ נמשך בפועל</div>
                  <div className={styles.v}>{fmtMoney(actualAmount)}</div>
                </div>
              )}
              {approvedAmount != null && (
                <div className={styles.statCard}>
                  <div className={styles.k}>סה&quot;כ אושר מראש</div>
                  <div className={styles.v}>{fmtMoney(approvedAmount)}</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {drawEntries.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>ציר הזמן של המשיכות</h2>
            <div className={styles.sectionNote}>{drawEntries.length} מנות</div>
          </div>
          <div className={styles.timeline}>
            {drawEntries.map(([date, ts], i) => {
              const amount = sum(ts, "actualAmount") ?? sum(ts, "approvedAmount");
              return (
                <div className={styles.tlRow} key={date}>
                  <div className={styles.tlDate}>{date}</div>
                  <div className={styles.tlSpine}>
                    <div className={styles.tlDot}></div>
                    {i < drawEntries.length - 1 && <div className={styles.tlLine}></div>}
                  </div>
                  <div className={styles.tlContent}>
                    <div className={styles.tlAmount}>{fmtMoney(amount)}</div>
                    <div className={styles.tlChips}>
                      {ts.map((t, j) => (
                        <span className={styles.mchip} key={j}>
                          {trackLabel(t)} · {fmtMoney(t.actualAmount ?? t.approvedAmount)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tracks.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{data.approvedDate ? "הריבית שאושרה מול הריבית שסגרתם" : "הריבית המקורית מול הריבית היום"}</h2>
            <div className={styles.sectionNote}>לפי מסלול</div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.mtable}>
              <thead>
                <tr>
                  <th>מסלול</th>
                  <th className={styles.num}>סכום</th>
                  <th className={styles.num}>{data.approvedDate ? "אושר מראש" : "בתחילת ההלוואה"}</th>
                  <th className={styles.num}>היום</th>
                  <th className={styles.num}>הפרש</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((t, i) => {
                  const approved = t.approvedRateAdjusted;
                  const actual = t.actualRateAdjusted;
                  let deltaEl = <span className={`${styles.delta} ${styles.deltaFlat}`}>—</span>;
                  if (approved != null && actual != null) {
                    const diff = Math.round((approved - actual) * 100) / 100;
                    if (diff > 0.005) {
                      deltaEl = <span className={`${styles.delta} ${styles.deltaPos}`}>↓ {diff.toFixed(2)}%</span>;
                    } else if (diff < -0.005) {
                      deltaEl = <span className={`${styles.delta} ${styles.deltaNeg}`}>↑ {Math.abs(diff).toFixed(2)}%</span>;
                    } else {
                      deltaEl = <span className={`${styles.delta} ${styles.deltaFlat}`}>ללא שינוי</span>;
                    }
                  }
                  return (
                    <tr key={i}>
                      <td className={styles.trackName}>
                        {trackLabel(t)}
                        {t.loanNumber && <span className={styles.trackSub}>{t.loanNumber}</span>}
                      </td>
                      <td className={styles.num}>{fmtMoney(t.actualAmount ?? t.approvedAmount)}</td>
                      <td className={styles.num}>{fmtPct(approved)}</td>
                      <td className={styles.num}>{fmtPct(actual)}</td>
                      <td className={styles.num}>{deltaEl}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>לוח זמנים קרוב</h2>
          </div>
          <div className={styles.tips}>
            {upcoming.map((t, i) => (
              <div className={styles.tip} key={i}>
                <span className={styles.tipBadge}>{t.nextRateChangeDate}</span>
                <div>
                  <h3>עדכון ריבית — {trackLabel(t)}</h3>
                  <p>
                    מסלול זה מתעדכן {t.rateChangeFrequencyMonths ? `כל ${t.rateChangeFrequencyMonths} חודשים` : "בהתאם לתנאי ההלוואה"}.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {comparison && comparison.scenarios.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>המשכנתה שלכם מול האפשרויות בשוק היום</h2>
            <div className={styles.sectionNote}>
              {comparison.asOfDate ? `נכון ל-${comparison.asOfDate}` : "השוואה בלבד, לצורך התייחסות בשיחה"}
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.mtable}>
              <thead>
                <tr>
                  <th>נתון</th>
                  {comparison.scenarios.map((s, i) => (
                    <th className={styles.num} key={i}>{s.label || `תרחיש ${i + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.trackName}>החזר ראשון</td>
                  {comparison.scenarios.map((s, i) => (
                    <td className={styles.num} key={i}>{fmtMoney(s.firstPayment)}</td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.trackName}>תשלומי ריבית והצמדה, סה&quot;כ</td>
                  {comparison.scenarios.map((s, i) => (
                    <td className={styles.num} key={i}>{fmtMoney(s.totalInterestAndLinkage)}</td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.trackName}>עלות כוללת לתקופה</td>
                  {comparison.scenarios.map((s, i) => (
                    <td className={styles.num} key={i}>{fmtMoney(s.totalCost)}</td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.trackName}>שיעור תשואה פנימי (שת&quot;פ)</td>
                  {comparison.scenarios.map((s, i) => (
                    <td className={styles.num} key={i}>{fmtPct(s.irr)}</td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.trackName}>הפרש לעומת המצב הנוכחי</td>
                  {comparison.scenarios.map((s, i) => {
                    if (s.savingsVsCurrent == null) {
                      return <td className={styles.num} key={i}><span className={`${styles.delta} ${styles.deltaFlat}`}>—</span></td>;
                    }
                    if (s.savingsVsCurrent === 0) {
                      return <td className={styles.num} key={i}><span className={`${styles.delta} ${styles.deltaFlat}`}>—</span></td>;
                    }
                    const cls = s.savingsVsCurrent > 0 ? styles.deltaPos : styles.deltaNeg;
                    const sign = s.savingsVsCurrent > 0 ? "+" : "";
                    return (
                      <td className={styles.num} key={i}>
                        <span className={`${styles.delta} ${cls}`}>{sign}{fmtMoney(s.savingsVsCurrent)}</span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          {comparison.note && (
            <p style={{ fontSize: 13.5, color: "var(--green-dark)", fontWeight: 600, marginTop: 10 }}>{comparison.note}</p>
          )}
          <p style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 8 }}>
            הנתונים הם הדמיה בלבד ואינם מהווים הצעה מחייבת. נשמח לעבור עליהם יחד ולהסביר מה עומד מאחורי כל תרחיש.
          </p>
        </section>
      )}

      <div className={styles.closing}>
        <p>נמשיך לעקוב אחרי המשכנתה שלכם ולבדוק מדי שנה איך היא עומדת מול השוק. אם תרצו לרדת לפרטים — אני כאן לשיחה.</p>
        <div className={styles.signoff}>
          צ&apos;יקו זוויבל
          <span>אדריכל המשכנתאות</span>
        </div>
      </div>

      <div className={styles.disclaimer}>
        * הנתונים מבוססים על מסמכי אישור עקרוני ויתרת סילוק שהוזנו על ידי היועץ. אינם מהווים ייעוץ פיננסי או אסמכתא לסילוק ההלוואה.
      </div>
    </div>
  );
}
