import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "דוח שנתי — TICO FINANCE",
  description: "דוחות משכנתה שנתיים ללקוחות — TICO FINANCE",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "דוח שנתי",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2E8B57",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>{children}</body>
    </html>
  );
}
