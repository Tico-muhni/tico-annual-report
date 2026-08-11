"use client";

import { useState, FormEvent } from "react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "קוד שגוי");
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("שגיאת רשת — נסה שוב");
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="TICO FINANCE" />
        <h1>דוח שנתי למשכנתה</h1>
        <p className="sub">TICO FINANCE · אדריכל המשכנתאות</p>
        <label htmlFor="pin">קוד גישה</label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
        />
        {error && <p className="err">{error}</p>}
        <button type="submit" disabled={loading || !pin}>
          {loading ? "בודק…" : "כניסה"}
        </button>
      </form>
    </div>
  );
}
