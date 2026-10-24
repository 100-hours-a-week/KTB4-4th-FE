// 첫 화면 표시와 HTML 해석을 막지 않도록 body 끝에서 웹폰트 정의 CSS를 비차단 방식으로 불러오는 컴포넌트

import { KAKAO_SMALL_SANS_STYLESHEET } from "@/app/fonts";

// 인쇄 전용으로 받아 화면 표시를 막지 않고, 다운로드가 끝나면 화면에 적용
// React가 관리하지 않는 요소로 추가해 hydration 시 media 속성 불일치가 생기지 않게 함
const loadFontStylesheet = `(function () {
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = ${JSON.stringify(KAKAO_SMALL_SANS_STYLESHEET)};
  link.media = "print";
  link.onload = function () {
    link.media = "all";
  };
  document.head.appendChild(link);
})();`;

export default function FontStylesheet() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: loadFontStylesheet }} />
      <noscript>
        <link rel="stylesheet" href={KAKAO_SMALL_SANS_STYLESHEET} />
      </noscript>
    </>
  );
}
