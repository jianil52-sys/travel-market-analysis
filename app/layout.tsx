import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "旅行市场分析 · Travel Signals",
  description: "按国家、季度、城市与客源市场观察旅行趋势。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
