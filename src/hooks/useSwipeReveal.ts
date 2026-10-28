// 목록 항목을 왼쪽으로 밀어 뒤에 숨은 액션 버튼을 드러내는 가로 스와이프 공통 훅
"use client";

import { useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";

const SWIPE_DIRECTION_DELTA = 10;

type SwipeAxis = "horizontal" | "vertical";

type UseSwipeRevealOptions = {
  // 드러낼 액션 버튼 너비이며, 절반 이상 밀면 버튼이 열린 상태로 고정됨
  actionWidth: number;
  isRevealed: boolean;
  onRevealChange: (isRevealed: boolean) => void;
};

export default function useSwipeReveal({
  actionWidth,
  isRevealed,
  onRevealChange,
}: UseSwipeRevealOptions) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const swipeAxisRef = useRef<SwipeAxis | null>(null);
  const currentOffsetRef = useRef(0);
  const hasMovedRef = useRef(false);
  const restingOffset = isRevealed ? -actionWidth : 0;

  const resetSwipe = () => {
    swipeAxisRef.current = null;
    setDragOffset(null);
  };

  const swipeHandlers = useSwipeable({
    delta: SWIPE_DIRECTION_DELTA,
    trackMouse: true,
    touchEventOptions: { passive: false },
    onTouchStartOrOnMouseDown: () => {
      swipeAxisRef.current = null;
      currentOffsetRef.current = restingOffset;
      hasMovedRef.current = false;
    },
    onSwiping: ({ first, absX, absY, deltaX, event }) => {
      if (first) {
        swipeAxisRef.current = absX > absY ? "horizontal" : "vertical";
      }

      if (swipeAxisRef.current !== "horizontal") return;

      if (event.cancelable) event.preventDefault();

      hasMovedRef.current = true;

      const nextOffset = Math.max(-actionWidth, Math.min(0, restingOffset + deltaX));

      currentOffsetRef.current = nextOffset;
      setDragOffset(nextOffset);
    },
    onTouchEndOrOnMouseUp: () => {
      if (swipeAxisRef.current === "horizontal") {
        onRevealChange(currentOffsetRef.current <= -actionWidth / 2);
      }

      resetSwipe();
    },
  });

  // 스와이프 직후 발생하는 클릭은 항목 선택으로 처리하지 않도록 한 번만 무시함
  const consumeSwipeClick = () => {
    if (!hasMovedRef.current) return false;

    hasMovedRef.current = false;
    return true;
  };

  return {
    translateX: dragOffset ?? restingOffset,
    isDragging: dragOffset !== null,
    swipeHandlers,
    resetSwipe,
    consumeSwipeClick,
  };
}
