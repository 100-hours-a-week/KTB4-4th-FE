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
      <body>
        <div className="mobile-layout">{children}</div>
      </body>
    </html>
  );
}
