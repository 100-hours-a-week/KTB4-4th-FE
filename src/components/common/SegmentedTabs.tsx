// 여러 화면에서 선택 상태를 전환하는 공통 세그먼트 탭
"use client";

import type { KeyboardEvent, ReactNode } from "react";

export type SegmentedTabItem<T extends string> = {
  value: T;
  label: ReactNode;
};

// pill은 둥근 배경 안에서 선택 탭을 강조하고, underline은 선택 탭 아래 막대로 강조함
type SegmentedTabsVariant = "pill" | "underline";

type SegmentedTabsProps<T extends string> = {
  items: readonly SegmentedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  variant?: SegmentedTabsVariant;
};

const VARIANT_CLASS_NAMES: Record<
  SegmentedTabsVariant,
  { list: string; indicator: string; tab: string }
> = {
  pill: {
    list: "rounded-full bg-background-subtle p-1",
    indicator: "top-1 bottom-1 left-1 rounded-full bg-surface shadow-sm",
    tab: "rounded-full px-3 py-2.5",
  },
  underline: {
    list: "",
    indicator:
      "bottom-0 left-0 h-[3px] px-4 before:block before:size-full before:rounded-full before:bg-primary",
    tab: "px-3 pt-3 pb-3.5",
  },
};

export default function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className = "",
  variant = "pill",
}: SegmentedTabsProps<T>) {
  const variantClassNames = VARIANT_CLASS_NAMES[variant];
  // pill은 목록 안쪽 여백(p-1)만큼 표시 막대 너비에서 제외함
  const indicatorWidth =
    variant === "pill" ? `calc((100% - 0.5rem) / ${items.length})` : `calc(100% / ${items.length})`;
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
      className={`relative flex w-full overflow-hidden ${variantClassNames.list} ${className}`}
    >
      {items.length > 0 && (
        <span
          aria-hidden="true"
          className={`absolute transition-transform duration-200 ease-standard ${variantClassNames.indicator}`}
          style={{
            width: indicatorWidth,
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
            className={`relative z-10 min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-center text-body transition-colors ${variantClassNames.tab} ${
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
