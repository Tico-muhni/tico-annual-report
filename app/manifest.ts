import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "דוח שנתי — TICO FINANCE",
    short_name: "דוח שנתי",
    description: "דוחות משכנתה שנתיים ללקוחות",
    start_url: "/",
    display: "standalone",
    background_color: "#F5FAF7",
    theme_color: "#2E8B57",
    lang: "he",
    dir: "rtl",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
