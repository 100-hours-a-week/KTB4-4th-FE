import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Need U",
  description: "Need U 모바일 웹",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
