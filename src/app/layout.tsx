// 전역 메타데이터와 폰트를 적용하는 루트 레이아웃
import { GoogleAnalytics } from "@next/third-parties/google";

import { kakaoSmallSans } from "./fonts";
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
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={kakaoSmallSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=notifications&display=swap"
        />
      </head>
      <body>
        <div className="mobile-layout">{children}</div>
      </body>

      <GoogleAnalytics gaId="G-6HBHQRT9R6" />
    </html>
  );
}
