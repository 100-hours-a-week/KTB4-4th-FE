// 애플리케이션 전역에서 사용하는 로컬 카카오 폰트 설정

import localFont from "next/font/local";

export const kakaoSmallSans = localFont({
  src: [
    {
      path: "../fonts/KakaoSmallSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/KakaoSmallSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-kakao-small-sans",
  display: "swap",
  fallback: ["Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
});
