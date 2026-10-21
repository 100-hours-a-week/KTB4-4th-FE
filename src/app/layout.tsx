// 전역 메타데이터와 폰트를 적용하는 루트 레이아웃
import { GoogleAnalytics } from "@next/third-parties/google";

import "./fonts.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Need U",
  description: "Need U 모바일 웹",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Android Chrome에서 키보드가 올라오면 화면 높이(dvh)를 줄여 입력창 위 내용이 가려지지 않게 함
  interactiveWidget: "resizes-content",
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <div className="mobile-layout">{children}</div>
      </body>

      <GoogleAnalytics gaId="G-6HBHQRT9R6" />
    </html>
  );
}
