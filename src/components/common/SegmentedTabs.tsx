// 여러 화면에서 선택 상태를 전환하는 공통 세그먼트 탭
"use client";

import type { KeyboardEvent, ReactNode } from "react";

export type SegmentedTabItem<T extends string> = {
  value: T;
  label: ReactNode;
};

type SegmentedTabsProps<T extends string> = {
  items: readonly SegmentedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export default function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className = "",
}: SegmentedTabsProps<T>) {
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = items.findIndex((item) => item.value === value);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    onChange(items[nextIndex].value);

    const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`relative flex w-full overflow-hidden rounded-full bg-background-subtle p-1 ${className}`}
    >
      {items.length > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 rounded-full bg-surface shadow-sm transition-transform duration-200 ease-standard"
          style={{
            width: `calc((100% - 0.5rem) / ${items.length})`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
        />
      )}
      {items.map((item) => {
        const isSelected = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={`relative z-10 min-w-0 flex-1 cursor-pointer rounded-full border-0 bg-transparent px-3 py-2.5 text-center text-body transition-colors ${
              isSelected ? "text-foreground" : "text-muted"
            }`}
          >
            <span className="font-bold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
