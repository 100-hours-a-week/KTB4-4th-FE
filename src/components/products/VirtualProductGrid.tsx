// 상품을 3개씩 한 줄로 묶어 스크롤 영역 근처의 줄만 렌더링하는 가상 그리드
"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Fragment, type Key, type ReactNode, useLayoutEffect, useRef, useState } from "react";

import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";

const COLUMN_COUNT = 3;
// 행 클래스의 gap-x-2와 함께 기존 그리드 간격을 유지하는 gap-y-5 값
const ROW_GAP_PX = 20;
// 첫 줄을 측정하기 전까지 사용하는 390px 화면 기준 줄 높이
const ESTIMATED_ROW_HEIGHT_PX = 203;
// 빠르게 스크롤해도 빈 영역이 보이지 않도록 화면 위아래로 더 렌더링하는 줄 수
const ROW_OVERSCAN = 4;

const SCROLL_AREA_SELECTOR = "[data-main-scroll-area]";
const ROW_SELECTOR = "[data-virtual-row]";

// 줄 높이가 예상값과 다른 화면에서 뒤로 가기로 돌아오면 전체 높이가 짧아 복원 위치가 잘리므로,
// 돌아온 첫 렌더링부터 실제 높이를 쓰도록 측정값을 보관함
let lastMeasuredRowHeight: number | null = null;

type VirtualProductGridProps<Item> = {
  items: readonly Item[];
  getItemKey: (item: Item) => Key;
  renderItem: (item: Item, index: number) => ReactNode;
  // 다음 페이지 카드가 들어올 칸에 표시할 스켈레톤 수
  skeletonCount?: number;
  isDimmed?: boolean;
};

export default function VirtualProductGrid<Item>({
  items,
  getItemKey,
  renderItem,
  skeletonCount = 0,
  isDimmed = false,
}: VirtualProductGridProps<Item>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [rowHeight, setRowHeight] = useState(
    () => lastMeasuredRowHeight ?? ESTIMATED_ROW_HEIGHT_PX,
  );
  // 마지막 줄의 빈 칸부터 스켈레톤을 채워 다음 페이지 카드가 같은 위치에서 교체되게 함
  const cellCount = items.length + skeletonCount;

  const virtualizer = useVirtualizer({
    count: Math.ceil(cellCount / COLUMN_COUNT),
    getScrollElement: () => gridRef.current?.closest<HTMLElement>(SCROLL_AREA_SELECTOR) ?? null,
    estimateSize: () => rowHeight,
    gap: ROW_GAP_PX,
    overscan: ROW_OVERSCAN,
    scrollMargin,
  });

  // 목록 위 영역의 높이와 카드 폭이 바뀌면 위치 보정값과 줄 높이를 다시 계산함
  useLayoutEffect(() => {
    const grid = gridRef.current;
    const scrollArea = grid?.closest<HTMLElement>(SCROLL_AREA_SELECTOR);
    if (!grid || !scrollArea) return;

    const updateLayout = () => {
      setScrollMargin(
        grid.getBoundingClientRect().top -
          scrollArea.getBoundingClientRect().top +
          scrollArea.scrollTop,
      );

      // 상품명 2줄 높이를 확보해 모든 줄의 높이가 같으므로 렌더링된 한 줄만 측정함
      const row = grid.querySelector(ROW_SELECTOR);
      if (row) {
        lastMeasuredRowHeight = row.getBoundingClientRect().height;
        setRowHeight(lastMeasuredRowHeight);
      }
    };

    // 복원으로 발생한 스크롤 이벤트가 ResizeObserver보다 먼저 처리되므로 위치 보정값을 바로 계산함
    updateLayout();

    const observer = new ResizeObserver(updateLayout);
    observer.observe(grid);

    const main = grid.closest("main");
    if (main) {
      observer.observe(main);
    }

    return () => observer.disconnect();
  }, []);

  // 줄 높이는 위치 계산의 캐시 기준에 포함되지 않으므로 바뀌면 직접 다시 계산하게 함
  useLayoutEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  return (
    <div
      ref={gridRef}
      aria-busy={isDimmed}
      className={`relative w-full ${isDimmed ? "opacity-50" : ""}`}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const startIndex = virtualRow.index * COLUMN_COUNT;
        const endIndex = Math.min(startIndex + COLUMN_COUNT, cellCount);
        const rowSkeletonCount = endIndex - Math.max(startIndex, items.length);

        return (
          <div
            key={virtualRow.key}
            data-virtual-row
            className="absolute left-0 top-0 grid w-full grid-cols-3 gap-x-2"
            style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
          >
            {items.slice(startIndex, endIndex).map((item, columnIndex) => (
              <Fragment key={getItemKey(item)}>
                {renderItem(item, startIndex + columnIndex)}
              </Fragment>
            ))}
            {Array.from({ length: Math.max(rowSkeletonCount, 0) }, (_, skeletonIndex) => (
              <ProductCardSkeleton key={`next-page-skeleton-${skeletonIndex}`} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
