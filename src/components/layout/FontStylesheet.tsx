// 첫 화면 표시와 초기 JS 다운로드를 막지 않도록 웹폰트 정의 CSS를 비차단 방식으로 불러오고, 첫 방문은 페이지 로드 이후로 미루는 컴포넌트

import { KAKAO_SMALL_SANS_STYLESHEET } from "@/app/fonts";

// 폰트 조각까지 받은 적이 있는지 기록하는 localStorage 키 (값은 버전이 포함된 CSS 경로)
const FONT_LOADED_STORAGE_KEY = "needu-font-stylesheet";

// 인쇄 전용으로 받아 화면 표시를 막지 않고, 다운로드가 끝나면 화면에 적용
// React가 관리하지 않는 요소로 추가해 hydration 시 media 속성 불일치가 생기지 않게 함
// 첫 방문은 우선순위가 가장 높은 폰트 조각이 초기 JS와 대역폭을 나눠 쓰지 않도록 load 이후 요청하고,
// 같은 버전의 폰트를 받은 적이 있는 재방문은 캐시된 폰트를 바로 적용하도록 즉시 요청
const loadFontStylesheet = `(function () {
  var href = ${JSON.stringify(KAKAO_SMALL_SANS_STYLESHEET)};
  var storageKey = ${JSON.stringify(FONT_LOADED_STORAGE_KEY)};
  function load() {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.media = "print";
    link.onload = function () {
      link.media = "all";
      document.fonts.ready.then(function () {
        try {
          localStorage.setItem(storageKey, href);
        } catch (error) {}
      });
    };
    document.head.appendChild(link);
  }
  var isCached = false;
  try {
    isCached = localStorage.getItem(storageKey) === href;
  } catch (error) {}
  if (isCached || document.readyState === "complete") {
    load();
  } else {
    window.addEventListener("load", load, { once: true });
  }
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
