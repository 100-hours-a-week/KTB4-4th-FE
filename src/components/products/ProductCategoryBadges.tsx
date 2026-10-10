// 추천 상품 목록 위에서 카테고리를 선택하는 가로 스크롤 배지 목록
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import type { ProductCategory } from "@/mocks/productCategories";

type ScrollDirection = "left" | "right";

// 페이지 배경색에 맞춰 화살표 버튼 그라데이션 색상을 지정
const EDGE_FADE_CLASS_NAMES = {
  background: "from-background",
  "background-subtle": "from-background-subtle",
} as const;

// 목록 폭 대비 화살표 버튼 1회 클릭 시 이동하는 비율
const ARROW_SCROLL_RATIO = 0.8;

const getScrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

type ProductCategoryBadgesProps = {
  categories: readonly ProductCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  edgeFadeColor?: keyof typeof EDGE_FADE_CLASS_NAMES;
  className?: string;
};

export default function ProductCategoryBadges({
  categories,
  value,
  onChange,
  edgeFadeColor = "background",
  className = "",
}: ProductCategoryBadgesProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollEdges = useCallback(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    setCanScrollLeft(list.scrollLeft > 1);
    setCanScrollRight(list.scrollLeft + list.clientWidth < list.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    const resizeObserver = new ResizeObserver(updateScrollEdges);
    resizeObserver.observe(list);
    list.addEventListener("scroll", updateScrollEdges, { passive: true });

    return () => {
      resizeObserver.disconnect();
      list.removeEventListener("scroll", updateScrollEdges);
    };
  }, [updateScrollEdges]);

  // 잘린 배지를 누르면 오른쪽 끝 배지는 목록 왼쪽 끝으로, 왼쪽 끝 배지는 목록 오른쪽 끝으로 스크롤함
  const scrollClippedTabIntoView = (tab: HTMLButtonElement) => {
    const list = tab.parentElement;

    if (!list) {
      return;
    }

    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    let scrollOffset: number | null = null;

    if (tabRect.right > listRect.right) {
      scrollOffset = tabRect.left - listRect.left;
    } else if (tabRect.left < listRect.left) {
      // 페이지 여백까지 넓힌 오른쪽 padding을 제외한 위치에 배지 오른쪽 끝을 맞춤
      const listPaddingRight = parseFloat(getComputedStyle(list).paddingRight);
      scrollOffset = tabRect.right - (listRect.right - listPaddingRight);
    }

    if (scrollOffset === null) {
      return;
    }

    list.scrollTo({
      left: list.scrollLeft + scrollOffset,
      behavior: getScrollBehavior(),
    });
  };

  // 마우스 환경에서 화살표 버튼을 누르면 보이는 목록 폭의 일정 비율만큼 가로 스크롤함
  const handleArrowClick = (direction: ScrollDirection) => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    const visibleWidth = list.clientWidth - parseFloat(getComputedStyle(list).paddingRight);
    const distance = visibleWidth * ARROW_SCROLL_RATIO;

    list.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: getScrollBehavior(),
    });
  };

  const renderArrowButton = (direction: ScrollDirection) => {
    const isLeft = direction === "left";
    const isVisible = isLeft ? canScrollLeft : canScrollRight;

    if (!isVisible) {
      return null;
    }

    // 키보드는 방향키로 탭을 이동할 수 있으므로 마우스 보조 버튼은 포커스·보조기기 대상에서 제외
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => handleArrowClick(direction)}
        className={`absolute top-0 bottom-0 z-10 hidden w-12 cursor-pointer items-center border-0 to-transparent text-foreground pointer-fine:flex ${
          isLeft
            ? `left-0 justify-start bg-linear-to-r ${EDGE_FADE_CLASS_NAMES[edgeFadeColor]}`
            : `right-0 justify-end bg-linear-to-l ${EDGE_FADE_CLASS_NAMES[edgeFadeColor]}`
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className={isLeft ? "" : "-scale-x-100"}
        >
          <path
            d="M15 4L7 12L15 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  };

  const handleTabClick = (event: MouseEvent<HTMLButtonElement>, categoryId: string) => {
    onChange(categoryId);
    scrollClippedTabIntoView(event.currentTarget);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = categories.findIndex((category) => category.id === value);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % categories.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + categories.length) % categories.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = categories.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    onChange(categories[nextIndex].id);

    const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs[nextIndex]?.focus();
  };

  return (
    // 오른쪽 페이지 여백까지 목록을 넓혀 마지막 배지가 잘려 보이도록 함
    <div className={`relative -mr-page ${className}`}>
      {renderArrowButton("left")}
      <div
        ref={listRef}
        role="tablist"
        aria-label="상품 카테고리"
        onKeyDown={handleKeyDown}
        className="flex gap-5 overflow-x-auto pr-page [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => {
          const isSelected = category.id === value;

          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={(event) => handleTabClick(event, category.id)}
              className={`relative shrink-0 cursor-pointer border-0 bg-transparent px-0.5 text-body-lg whitespace-nowrap transition-colors ${
                isSelected ? "font-bold text-foreground" : "font-medium text-muted"
              }`}
            >
              {category.name}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>
      {renderArrowButton("right")}
    </div>
  );
}
