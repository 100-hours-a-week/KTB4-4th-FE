// 상품을 3개씩 한 줄로 묶어 스크롤 영역 근처의 줄만 렌더링하는 가상 그리드
"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Fragment, type Key, type ReactNode, useLayoutEffect, useRef, useState } from "react";

const COLUMN_COUNT = 3;
// 행 클래스의 gap-x-2와 함께 기존 그리드 간격을 유지하는 gap-y-5 값
const ROW_GAP_PX = 20;
// 첫 줄을 측정하기 전까지 사용하는 390px 화면 기준 줄 높이
const ESTIMATED_ROW_HEIGHT_PX = 203;
// 빠르게 스크롤해도 빈 영역이 보이지 않도록 화면 위아래로 더 렌더링하는 줄 수
const ROW_OVERSCAN = 4;

const SCROLL_AREA_SELECTOR = "[data-main-scroll-area]";
const ROW_SELECTOR = "[data-virtual-row]";

type VirtualProductGridProps<Item> = {
  items: readonly Item[];
  getItemKey: (item: Item) => Key;
  renderItem: (item: Item, index: number) => ReactNode;
  isDimmed?: boolean;
};

export default function VirtualProductGrid<Item>({
  items,
  getItemKey,
  renderItem,
  isDimmed = false,
}: VirtualProductGridProps<Item>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [rowHeight, setRowHeight] = useState(ESTIMATED_ROW_HEIGHT_PX);

  const virtualizer = useVirtualizer({
    count: Math.ceil(items.length / COLUMN_COUNT),
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
        setRowHeight(row.getBoundingClientRect().height);
      }
    };

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

        return (
          <div
            key={virtualRow.key}
            data-virtual-row
            className="absolute left-0 top-0 grid w-full grid-cols-3 gap-x-2"
            style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
          >
            {items.slice(startIndex, startIndex + COLUMN_COUNT).map((item, columnIndex) => (
              <Fragment key={getItemKey(item)}>
                {renderItem(item, startIndex + columnIndex)}
              </Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
}
