"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ClientRow } from "@/lib/schema";
import type { MortgageData, MortgageTrack } from "@/lib/mortgage-types";
import { EMPTY_TRACK } from "@/lib/mortgage-types";

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
  const [clientList, setClientList] = useState<ClientRow[]>([]);
  const [clientId, setCaseId] = useState<string>(searchParams.get("clientId") ?? "");
  const [data, setData] = useState<MortgageData>(EMPTY_DATA);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((rows: ClientRow[]) => setClientList(rows))
      .catch(() => setClientList([]));
  }, []);

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
      const res = await fetch("/api/mortgage-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: Number(clientId), mortgageData: data }),
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

  return (
    <div className="wrap">
      <div className="masthead">
        <div>
          <h1>דוח משכנתה — הזנת נתונים</h1>
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
            <input type="number" value={data.totalApprovedAmount ?? ""} onChange={(e) => setData((d) => ({ ...d, totalApprovedAmount: numOrNull(e.target.value) }))} />
          </div>
          <div className="row">
            <span className="k">סה&quot;כ נמשך בפועל</span>
            <input type="number" value={data.totalActualAmount ?? ""} onChange={(e) => setData((d) => ({ ...d, totalActualAmount: numOrNull(e.target.value) }))} />
          </div>
          <div className="row">
            <span className="k">יתרת קרן נוכחית</span>
            <input type="number" value={data.totalCurrentBalance ?? ""} onChange={(e) => setData((d) => ({ ...d, totalCurrentBalance: numOrNull(e.target.value) }))} />
          </div>
          <div className="row">
            <span className="k">החזר חודשי, אושר מראש</span>
            <input type="number" value={data.totalApprovedMonthlyPayment ?? ""} onChange={(e) => setData((d) => ({ ...d, totalApprovedMonthlyPayment: numOrNull(e.target.value) }))} />
          </div>
          <div className="row">
            <span className="k">החזר חודשי נוכחי</span>
            <input type="number" value={data.totalCurrentMonthlyPayment ?? ""} onChange={(e) => setData((d) => ({ ...d, totalCurrentMonthlyPayment: numOrNull(e.target.value) }))} />
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
              <input type="number" value={t.approvedAmount ?? ""} onChange={(e) => updateTrack(i, { approvedAmount: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">ריבית, אושרה מראש</span>
              <input type="number" step="0.01" value={t.approvedRateAdjusted ?? ""} onChange={(e) => updateTrack(i, { approvedRateAdjusted: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">תקופה (חודשים), אושרה</span>
              <input type="number" value={t.approvedPeriodMonths ?? ""} onChange={(e) => updateTrack(i, { approvedPeriodMonths: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">סכום בפועל</span>
              <input type="number" value={t.actualAmount ?? ""} onChange={(e) => updateTrack(i, { actualAmount: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">ריבית בפועל</span>
              <input type="number" step="0.01" value={t.actualRateAdjusted ?? ""} onChange={(e) => updateTrack(i, { actualRateAdjusted: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">תקופה (חודשים), בפועל</span>
              <input type="number" value={t.actualPeriodMonths ?? ""} onChange={(e) => updateTrack(i, { actualPeriodMonths: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">יתרת קרן נוכחית</span>
              <input type="number" value={t.currentPrincipalBalance ?? ""} onChange={(e) => updateTrack(i, { currentPrincipalBalance: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">החזר חודשי נוכחי</span>
              <input type="number" value={t.currentMonthlyPayment ?? ""} onChange={(e) => updateTrack(i, { currentMonthlyPayment: numOrNull(e.target.value) })} />
            </div>
            <div className="row">
              <span className="k">תאריך שינוי ריבית קרוב</span>
              <input type="text" placeholder="DD/MM/YYYY" value={t.nextRateChangeDate ?? ""} onChange={(e) => updateTrack(i, { nextRateChangeDate: e.target.value || null })} />
            </div>
            <div className="row">
              <span className="k">תדירות שינוי ריבית (חודשים)</span>
              <input type="number" value={t.rateChangeFrequencyMonths ?? ""} onChange={(e) => updateTrack(i, { rateChangeFrequencyMonths: numOrNull(e.target.value) })} />
            </div>
          </div>
        ))}
      </div>

      <div className="quickadd" style={{ marginTop: 14 }}>
        <button type="button" className="qa-btn" onClick={addTrack}>הוסף מסלול <span className="plus">+</span></button>
      </div>

      <div className="deal-form" style={{ marginTop: 22 }}>
        <div className="actions">
          <button type="button" className="btn" disabled={saving} onClick={handleSubmit}>
            {saving ? "שומר..." : "שמור דוח משכנתה"}
          </button>
        </div>
      </div>
    </div>
  );
}
