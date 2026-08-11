import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, verifyPin } from "@/lib/auth";
import { ensureConfig } from "@/lib/config-service";

export async function POST(req: NextRequest) {
  let pin: unknown;
  try {
    const body = await req.json();
    pin = body?.pin;
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  if (typeof pin !== "string") {
    return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  }

  const row = await ensureConfig();

  if (!(await verifyPin(pin, row.pinHash))) {
    return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
