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
  // 대용량 폰트가 초기 JS보다 높은 우선순위로 대역폭을 점유하지 않도록 미리 불러오기 비활성화
  preload: false,
  fallback: ["Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
});
