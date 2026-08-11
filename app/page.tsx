"use client";

import { useEffect, useState, FormEvent } from "react";
import type { ClientRow } from "@/lib/schema";

export default function HomePage() {
  const [clientList, setClientList] = useState<ClientRow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  function loadClients() {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((rows: ClientRow[]) => setClientList(rows))
      .catch(() => setClientList([]));
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function submitClient(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      setName("");
      setPhone("");
      setEmail("");
      setFormOpen(false);
      loadClients();
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="wrap">
      <div className="masthead">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="TICO FINANCE" style={{ marginBottom: 8, display: "block" }} />
          <h1>דוח שנתי למשכנתה</h1>
          <p className="sub">לקוחות ודוחות</p>
        </div>
        <button className="btn ghost" onClick={logout}>התנתקות</button>
      </div>

      <div className="quickadd">
        <button className="qa-btn" onClick={() => setFormOpen((v) => !v)}>
          לקוח חדש <span className="plus">+</span>
        </button>
      </div>

      {formOpen && (
        <form className="deal-form" onSubmit={submitClient}>
          <div className="field">
            <label htmlFor="cname">שם</label>
            <input id="cname" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="cphone">טלפון</label>
            <input id="cphone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cemail">אימייל</label>
            <input id="cemail" type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="actions">
            <button className="btn" type="submit" disabled={saving || !name.trim()}>
              {saving ? "שומר..." : "הוסף לקוח"}
            </button>
            <button className="btn ghost" type="button" onClick={() => setFormOpen(false)}>ביטול</button>
          </div>
        </form>
      )}

      <ul className="client-list">
        {clientList.length === 0 && <li className="log-empty">אין עדיין לקוחות — הוסיפו לקוח למעלה.</li>}
        {clientList.map((c) => (
          <li key={c.id}>
            <div className="cl-main">
              <span className="cl-name">{c.name}</span>
            </div>
            {(c.phone || c.email) && <div className="cl-sub">{[c.phone, c.email].filter(Boolean).join(" · ")}</div>}
            <div className="cl-actions">
              <a className="btn ghost" href={`/mortgage-reports?clientId=${c.id}`}>דוח משכנתה חדש</a>
            </div>
          </li>
        ))}
      </ul>

      <footer className="credit">TICO FINANCE · אדריכל המשכנתאות</footer>
    </div>
  );
}
