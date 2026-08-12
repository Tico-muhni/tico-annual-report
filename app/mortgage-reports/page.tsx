"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ClientRow } from "@/lib/schema";
import type { ComparisonScenario, MortgageComparison, MortgageData, MortgageTrack } from "@/lib/mortgage-types";
import { EMPTY_SCENARIO, EMPTY_TRACK } from "@/lib/mortgage-types";

const EMPTY_COMPARISON: MortgageComparison = { asOfDate: null, scenarios: [], note: null };

const STANDARD_SCENARIO_LABELS = ["המשכנתה הנוכחית", "משכנתה חדשה, היום", "מיחזור אפשרי"];

const EMPTY_DATA: MortgageData = {
  clientName: "",
  idNumber: null,
  bankName: null,
  branchName: null,
  accountNumber: null,
  approvedDate: null,
  payoffDate: null,
  totalApprovedAmount: null,
  totalActualAmount: null,
  totalCurrentBalance: null,
  totalApprovedMonthlyPayment: null,
  totalCurrentMonthlyPayment: null,
  tracks: [],
};

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function MortgageReportsPage() {
  return (
    <Suspense fallback={null}>
      <MortgageReportsForm />
    </Suspense>
  );
}

function MortgageReportsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const [clientList, setClientList] = useState<ClientRow[]>([]);
  const [clientId, setCaseId] = useState<string>(searchParams.get("clientId") ?? "");
  const [data, setData] = useState<MortgageData>(EMPTY_DATA);
  const [comparison, setComparison] = useState<MortgageComparison>(EMPTY_COMPARISON);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((rows: ClientRow[]) => setClientList(rows))
      .catch(() => setClientList([]));
  }, []);

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/mortgage-reports/${editId}`)
      .then((r) => r.json())
      .then((row) => {
        if (row?.mortgageData) {
          setData(row.mortgageData as MortgageData);
          setCaseId(String(row.clientId));
        }
        if (row?.comparisonData) {
          setComparison(row.comparisonData as MortgageComparison);
        }
      })
      .catch(() => setMessage("לא ניתן לטעון את הדוח לעריכה"))
      .finally(() => setLoadingEdit(false));
  }, [editId]);

  function updateTrack(i: number, patch: Partial<MortgageTrack>) {
    setData((d) => ({
      ...d,
      tracks: d.tracks.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));
  }

  function addTrack() {
    setData((d) => ({ ...d, tracks: [...d.tracks, { ...EMPTY_TRACK }] }));
  }

  function removeTrack(i: number) {
    setData((d) => ({ ...d, tracks: d.tracks.filter((_, idx) => idx !== i) }));
  }

  function updateScenario(i: number, patch: Partial<ComparisonScenario>) {
    setComparison((c) => ({
      ...c,
      scenarios: c.scenarios.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }

  function addScenario() {
    setComparison((c) => ({ ...c, scenarios: [...c.scenarios, { ...EMPTY_SCENARIO }] }));
  }

  function addStandardScenarios() {
    setComparison((c) => ({
      ...c,
      scenarios: [
        ...c.scenarios,
        ...STANDARD_SCENARIO_LABELS.map((label) => ({ ...EMPTY_SCENARIO, label })),
      ],
    }));
  }

  function removeScenario(i: number) {
    setComparison((c) => ({ ...c, scenarios: c.scenarios.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit() {
    setMessage(null);
    if (!clientId) {
      setMessage("בחר לקוח");
      return;
    }
    if (!data.clientName.trim()) {
      setMessage("שם הלקוח הוא שדה חובה");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(editId ? `/api/mortgage-reports/${editId}` : "/api/mortgage-reports", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: Number(clientId),
          mortgageData: data,
          comparisonData: comparison.scenarios.length > 0 ? comparison : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "שגיאה בשמירה");
      } else {
        router.push(`/mortgage-reports/${json.id}`);
      }
    } catch {
      setMessage("שגיאת רשת בשמירה");
    } finally {
      setSaving(false);
    }
  }

  if (loadingEdit) {
    return (
      <div className="wrap">
        <p className="log-empty">טוען דוח לעריכה...</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="masthead">
        <div>
          <h1>{editId ? "עריכת דוח משכנתה" : "דוח משכנתה — הזנת נתונים"}</h1>
          <p className="sub">קרא ל-Claude את ה-PDF-ים של הלקוח, ותעתיק לכאן את הנתונים</p>
        </div>
      </div>

      {message && <div className="toast" style={{ position: "static", transform: "none", marginBottom: 16 }}>{message}</div>}

      <div className="panels">
        <div className="panel wide">
          <div className="panel-head">פרטי לקוח ומקור</div>
          <div className="row">
            <span className="k">לקוח</span>
            <select value={clientId} onChange={(e) => setCaseId(e.target.value)}>
              <option value="">בחר לקוח...</option>
              {clientList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="row">
            <span className="k">שם הלקוח בדוח</span>
            <input
              type="text"
              value={data.clientName}
              onChange={(e) => setData((d) => ({ ...d, clientName: e.target.value }))}
            />
          </div>
          <div className="row">
            <span className="k">בנק</span>
            <input
              type="text"
              value={data.bankName ?? ""}
              onChange={(e) => setData((d) => ({ ...d, bankName: e.target.value || null }))}
            />
          </div>
          <div className="row">
            <span className="k">סניף</span>
            <input
              type="text"
              value={data.branchName ?? ""}
              onChange={(e) => setData((d) => ({ ...d, branchName: e.target.value || null }))}
            />
          </div>
          <div className="row">
            <span className="k">מספר חשבון</span>
            <input
              type="text"
              value={data.accountNumber ?? ""}
              onChange={(e) => setData((d) => ({ ...d, accountNumber: e.target.value || null }))}
            />
          </div>
          <div className="row">
            <span className="k">תאריך אישור עקרוני</span>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={data.approvedDate ?? ""}
              onChange={(e) => setData((d) => ({ ...d, approvedDate: e.target.value || null }))}
            />
          </div>
          <div className="row">
            <span className="k">תאריך יתרות לסילוק</span>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={data.payoffDate ?? ""}
              onChange={(e) => setData((d) => ({ ...d, payoffDate: e.target.value || null }))}
            />
          </div>
        </div>

        <div className="panel wide">
          <div className="panel-head">סה&quot;כ (אופציונלי — אפשר להשאיר ריק ולחשב מהמסלולים בהמשך)</div>
          <div className="row">
            <span className="k">סה&quot;כ אושר מראש</span>
            <input type="text" inputMode="decimal" value={data.totalApprovedAmount ?? ""} onChange={(e) => setData((d) => ({ ...d, totalApprovedAmount: numOrNull(e.target.value) }))} />
          </div>
          <div className="row">
            <span className="k">סה&quot;כ נמשך בפועל</span>
            <input type="text" inputMode="decimal" value={data.totalActualAmount ?? ""} onChange={(e) => setData((d) => ({ ...d, totalActualAmount: numOrNull(e.target.value) }))} />
          </div>
          <div className="row">
            <span className="k">יתרת קרן נוכחית</span>
            <input type="text" inputMode="decimal" value={data.totalCurrentBalance ?? ""} onChange={(e) => setData((d) => ({ ...d, totalCurrentBalance: numOrNull(e.target.value) }))} />
          </div>
          <div className="row">
            <span className="k">החזר חודשי, אושר מראש</span>
            <input type="text" inputMode="decimal" value={data.totalApprovedMonthlyPayment ?? ""} onChange={(e) => setData((d) => ({ ...d, totalApprovedMonthlyPayment: numOrNull(e.target.value) }))} />
          </div>
          <div className="row">
            <span className="k">החזר חודשי נוכחי</span>
            <input type="text" inputMode="decimal" value={data.totalCurrentMonthlyPayment ?? ""} onChange={(e) => setData((d) => ({ ...d, totalCurrentMonthlyPayment: numOrNull(e.target.value) }))} />
          </div>
        </div>
      </div>

      <div className="section-title">
        מסלולים
        <span className="idx">{data.tracks.length} מסלולים</span>
      </div>

      <div className="panels">
        {data.tracks.map((t, i) => (
          <div className="panel" key={i}>
            <div className="panel-head">
              מסלול {i + 1}
              <button type="button" className="edit" onClick={() => removeTrack(i)}>הסר ✕</button>
            </div>
            <div className="row">
              <span className="k">שם מסלול</span>
              <input type="text" value={t.trackName} onChange={(e) => updateTrack(i, { trackName: e.target.value })} />
            </div>
            <div className="row">
              <span className="k">מספר הלוואה</span>
              <input type="text" value={t.loanNumber} onChange={(e) => updateTrack(i, { loanNumber: e.target.value })} />
            </div>
            <div className="row">
              <span className="k">סוג ריבית</span>
              <select value={t.rateType} onChange={(e) => updateTrack(i, { rateType: e.target.value as MortgageTrack["rateType"] })}>
                <option value="fixed">קבועה</option>
                <option value="variable">משתנה</option>
              </select>
            </div>
            <div className="row">
              <span className="k">הצמדה</span>
              <select value={t.linkage} onChange={(e) => updateTrack(i, { linkage: e.target.value as MortgageTrack["linkage"] })}>
                <option value="unlinked">לא צמוד</option>
                <option value="linked">צמוד מדד</option>
              </select>
            </div>
            <div className="row">
              <span className="k">תאריך משיכה</span>
              <input type="text" placeholder="DD/MM/YYYY" value={t.drawDate} onChange={(e) => updateTrack(i, { drawDate: e.target.value })} />
            </div>
            <div className="row">
              <span className="k">סכום, אושר מראש</span>
              <input type="text" inputMode="decimal" value={t.approvedAmount ?? ""} onChange={(e) => updateTrack(i, { approvedAmount: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">ריבית, אושרה מראש / מקורית</span>
              <input type="text" inputMode="decimal" step="0.01" value={t.approvedRateAdjusted ?? ""} onChange={(e) => updateTrack(i, { approvedRateAdjusted: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">תקופה (חודשים), אושרה</span>
              <input type="text" inputMode="decimal" value={t.approvedPeriodMonths ?? ""} onChange={(e) => updateTrack(i, { approvedPeriodMonths: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">סכום בפועל</span>
              <input type="text" inputMode="decimal" value={t.actualAmount ?? ""} onChange={(e) => updateTrack(i, { actualAmount: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">ריבית בפועל</span>
              <input type="text" inputMode="decimal" step="0.01" value={t.actualRateAdjusted ?? ""} onChange={(e) => updateTrack(i, { actualRateAdjusted: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">תקופה (חודשים), בפועל</span>
              <input type="text" inputMode="decimal" value={t.actualPeriodMonths ?? ""} onChange={(e) => updateTrack(i, { actualPeriodMonths: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">יתרת קרן נוכחית</span>
              <input type="text" inputMode="decimal" value={t.currentPrincipalBalance ?? ""} onChange={(e) => updateTrack(i, { currentPrincipalBalance: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">החזר חודשי נוכחי</span>
              <input type="text" inputMode="decimal" value={t.currentMonthlyPayment ?? ""} onChange={(e) => updateTrack(i, { currentMonthlyPayment: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">תאריך שינוי ריבית קרוב</span>
              <input type="text" placeholder="DD/MM/YYYY" value={t.nextRateChangeDate ?? ""} onChange={(e) => updateTrack(i, { nextRateChangeDate: e.target.value || null })} />
            </div>
            <div className="row">
              <span className="k">תדירות שינוי ריבית (חודשים)</span>
              <input type="text" inputMode="decimal" value={t.rateChangeFrequencyMonths ?? ""} onChange={(e) => updateTrack(i, { rateChangeFrequencyMonths: numOrNull(e.target.value) })} />
            </div>
          </div>
        ))}
      </div>

      <div className="quickadd" style={{ marginTop: 14 }}>
        <button type="button" className="qa-btn" onClick={addTrack}>הוסף מסלול <span className="plus">+</span></button>
      </div>

      <div className="section-title">
        השוואה לשוק (אופציונלי)
        <span className="idx">{comparison.scenarios.length} תרחישים</span>
      </div>
      <p className="log-empty" style={{ padding: "0 0 10px" }}>
        מדוח השוואת תמהילים (למשל SMARTNPV) — נתונים מצטברים בלבד, בלי לפרט אילו מסלולים משתנים בכל תרחיש.
      </p>

      <div className="panel wide" style={{ marginBottom: 14 }}>
        <div className="row">
          <span className="k">תאריך ההשוואה</span>
          <input
            type="text"
            placeholder="DD/MM/YYYY"
            value={comparison.asOfDate ?? ""}
            onChange={(e) => setComparison((c) => ({ ...c, asOfDate: e.target.value || null }))}
          />
        </div>
        <div className="row">
          <span className="k">הערה (מוצגת בעדינות בדוח)</span>
          <input
            type="text"
            value={comparison.note ?? ""}
            onChange={(e) => setComparison((c) => ({ ...c, note: e.target.value || null }))}
          />
        </div>
      </div>

      <div className="panels">
        {comparison.scenarios.map((s, i) => (
          <div className="panel" key={i}>
            <div className="panel-head">
              תרחיש {i + 1}
              <button type="button" className="edit" onClick={() => removeScenario(i)}>הסר ✕</button>
            </div>
            <div className="row">
              <span className="k">תווית</span>
              <input type="text" placeholder="המשכנתה הנוכחית / משכנתה חדשה, היום / מיחזור אפשרי" value={s.label} onChange={(e) => updateScenario(i, { label: e.target.value })} />
            </div>
            <div className="row">
              <span className="k">החזר ראשון</span>
              <input type="text" inputMode="decimal" value={s.firstPayment ?? ""} onChange={(e) => updateScenario(i, { firstPayment: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">תשלומי ריבית והצמדה, סה&quot;כ</span>
              <input type="text" inputMode="decimal" value={s.totalInterestAndLinkage ?? ""} onChange={(e) => updateScenario(i, { totalInterestAndLinkage: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">עלות כוללת לתקופה</span>
              <input type="text" inputMode="decimal" value={s.totalCost ?? ""} onChange={(e) => updateScenario(i, { totalCost: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">שת&quot;פ (%)</span>
              <input type="text" inputMode="decimal" step="0.01" value={s.irr ?? ""} onChange={(e) => updateScenario(i, { irr: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">הפרש לעומת המצב הנוכחי</span>
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  type="button"
                  className="edit"
                  title="החלף סימן"
                  onClick={() => updateScenario(i, { savingsVsCurrent: s.savingsVsCurrent == null ? null : -s.savingsVsCurrent })}
                >
                  ±
                </button>
                <input type="text" inputMode="decimal" value={s.savingsVsCurrent ?? ""} onChange={(e) => updateScenario(i, { savingsVsCurrent: numOrNull(e.target.value) })} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="quickadd" style={{ marginTop: 14 }}>
        {comparison.scenarios.length === 0 && (
          <button type="button" className="qa-btn primary" onClick={addStandardScenarios}>
            הוסף השוואה (נוכחית / חדשה היום / מיחזור) <span className="plus">+</span>
          </button>
        )}
        <button type="button" className="qa-btn" onClick={addScenario}>הוסף תרחיש בודד <span className="plus">+</span></button>
      </div>

      <div className="deal-form" style={{ marginTop: 22 }}>
        <div className="actions">
          <button type="button" className="btn" disabled={saving} onClick={handleSubmit}>
            {saving ? "שומר..." : editId ? "שמור שינויים" : "שמור דוח משכנתה"}
          </button>
        </div>
      </div>
    </div>
  );
}
