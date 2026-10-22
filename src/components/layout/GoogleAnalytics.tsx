// 초기 JS와 대역폭을 나눠 쓰지 않도록 페이지 로드 후 Google Analytics 스크립트를 불러오는 컴포넌트

import Script from "next/script";

type GoogleAnalyticsProps = {
  gaId: string;
};

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  // gtag 본체가 도착하기 전의 페이지뷰를 dataLayer에 쌓아 두도록 초기화는 즉시 실행
  const initGoogleAnalytics = `window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", ${JSON.stringify(gaId)});`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: initGoogleAnalytics }} />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
    </>
  );
}
