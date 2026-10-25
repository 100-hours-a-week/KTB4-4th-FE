// 전역 메타데이터와 폰트를 적용하는 루트 레이아웃
import FontStylesheet from "@/components/layout/FontStylesheet";
import GoogleAnalytics from "@/components/layout/GoogleAnalytics";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  // OG 이미지·canonical 등 상대 경로 메타데이터를 절대 URL로 변환하는 기준 주소
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // 하위 페이지가 title을 지정하면 "페이지명 | Need U" 형태로 표시
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // 대부분 인증이 필요한 개인 화면이므로 기본 noindex, 공개 페이지에서만 개별 허용
  robots: {
    index: false,
    follow: false,
  },
  keywords: ["Need U", "선물 추천", "AI 선물 추천", "취향 분석", "맞춤 상품 추천", "친구 선물"],
  // 공유 이미지는 app/opengraph-image.png 파일 컨벤션으로 자동 연결
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
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
        {/* head에 두면 앞선 CSS를 기다리며 HTML 해석을 멈춰 JS 요청이 지연되므로 body 끝에 배치 */}
        <FontStylesheet />
        <GoogleAnalytics gaId="G-6HBHQRT9R6" />
      </body>
    </html>
  );
}
