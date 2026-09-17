import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Need U",
  description: "Need U 모바일 웹",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <div className="mobile-layout">
          <Header />
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
          <BottomNavigation />
        </div>
      </body>
    </html>
  );
}
