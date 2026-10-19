// 키보드가 올라와도 레이아웃 높이가 줄지 않는 iOS Safari에서 화면 높이를 실제 보이는 영역에 맞추는 훅
"use client";

import { useEffect } from "react";

const VISUAL_VIEWPORT_HEIGHT_PROPERTY = "--visual-viewport-height";

export default function useVisualViewportHeight() {
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const root = document.documentElement;

    const syncHeight = () => {
      root.style.setProperty(VISUAL_VIEWPORT_HEIGHT_PROPERTY, `${visualViewport.height}px`);

      // iOS가 입력창을 보이게 하려고 페이지를 밀어 올리면 헤더가 가려지므로 원래 위치로 되돌림
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    syncHeight();
    visualViewport.addEventListener("resize", syncHeight);
    visualViewport.addEventListener("scroll", syncHeight);

    return () => {
      visualViewport.removeEventListener("resize", syncHeight);
      visualViewport.removeEventListener("scroll", syncHeight);
      root.style.removeProperty(VISUAL_VIEWPORT_HEIGHT_PROPERTY);
    };
  }, []);
}
