// 카카오 작은글씨 웹폰트를 HTML head에서 미리 불러오도록 등록하는 함수

import { preload } from "react-dom";

const KAKAO_SMALL_SANS_FONT_URLS = [
  "/fonts/KakaoSmallSans-Regular-v2.002.woff2",
  "/fonts/KakaoSmallSans-Bold-v2.002.woff2",
];

export function preloadKakaoSmallSans() {
  KAKAO_SMALL_SANS_FONT_URLS.forEach((href) => {
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  });
}
