// 상품 목록의 스크롤 위치를 방문 기록별로 저장하고 뒤로 가기로 돌아왔을 때 복원하는 훅
"use client";

import { useLayoutEffect } from "react";

import {
  readProductListScrollTop,
  saveProductListScrollTop,
} from "@/stores/productListRestoreStore";

export function useProductListScrollRestore(listId: string) {
  // 상세 이동으로 목록이 사라진 뒤 도착하는 위치 0의 scroll 이벤트를 받지 않도록 커밋 중에 리스너를 정리하고,
  // 맨 위 화면이 먼저 그려지지 않도록 그리기 전에 복원함
  useLayoutEffect(() => {
    const scrollArea = document.querySelector<HTMLElement>("[data-main-scroll-area]");
    if (!scrollArea) return;

    const savedScrollTop = readProductListScrollTop(listId);
    if (savedScrollTop !== null) {
      scrollArea.scrollTop = savedScrollTop;
    }

    const handleScroll = () => saveProductListScrollTop(listId, scrollArea.scrollTop);

    scrollArea.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollArea.removeEventListener("scroll", handleScroll);
  }, [listId]);
}
