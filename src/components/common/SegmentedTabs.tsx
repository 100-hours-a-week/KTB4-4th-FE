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
      className={`flex w-full rounded-full bg-background-subtle p-1 ${className}`}
    >
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
            className={`min-w-0 flex-1 cursor-pointer rounded-full border-0 px-3 py-2.5 text-center text-body transition-colors ${
              isSelected ? "bg-surface text-foreground shadow-sm" : "bg-transparent text-muted"
            }`}
          >
            <span className="font-bold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
