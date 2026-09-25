// 추천 상품의 예산 범위를 조절하고 확정값을 전달하는 슬라이더 컴포넌트

"use client";

import { useRef, useState } from "react";

import styles from "./PriceRangeSlider.module.css";

import type { CSSProperties, ChangeEvent } from "react";

type PriceRangeSliderProps = {
  availableMinPrice: number;
  availableMaxPrice: number;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  step?: number;
  onPriceRangeCommit?: (priceRange: PriceRange) => void;
};

export interface PriceRange {
  minPrice: number;
  maxPrice: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const formatPrice = (price: number) => {
  if (price >= 10_000 && price % 10_000 === 0) {
    return `${price / 10_000}만 원`;
  }

  return `${price.toLocaleString("ko-KR")}원`;
};

export default function PriceRangeSlider({
  availableMinPrice,
  availableMaxPrice,
  initialMinPrice = availableMinPrice,
  initialMaxPrice = availableMaxPrice,
  step = 10_000,
  onPriceRangeCommit,
}: PriceRangeSliderProps) {
  const clampedInitialMinPrice = clamp(initialMinPrice, availableMinPrice, availableMaxPrice);
  const clampedInitialMaxPrice = clamp(initialMaxPrice, availableMinPrice, availableMaxPrice);
  const [draftMinPrice, setDraftMinPrice] = useState(clampedInitialMinPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(clampedInitialMaxPrice);
  const lastCommittedRangeRef = useRef<PriceRange>({
    minPrice: clampedInitialMinPrice,
    maxPrice: clampedInitialMaxPrice,
  });

  const isRangeValid = draftMinPrice <= draftMaxPrice;
  const availableRange = Math.max(availableMaxPrice - availableMinPrice, 1);
  const selectedRangeStyle = {
    left: `${((draftMinPrice - availableMinPrice) / availableRange) * 100}%`,
    right: `${100 - ((draftMaxPrice - availableMinPrice) / availableRange) * 100}%`,
  } satisfies CSSProperties;

  const handleMinPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraftMinPrice(Math.min(Number(event.target.value), draftMaxPrice));
  };

  const handleMaxPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraftMaxPrice(Math.max(Number(event.target.value), draftMinPrice));
  };

  const commitPriceRange = () => {
    const lastCommittedRange = lastCommittedRangeRef.current;

    if (
      lastCommittedRange.minPrice === draftMinPrice &&
      lastCommittedRange.maxPrice === draftMaxPrice
    ) {
      return;
    }

    const nextPriceRange = {
      minPrice: draftMinPrice,
      maxPrice: draftMaxPrice,
    };

    lastCommittedRangeRef.current = nextPriceRange;
    onPriceRangeCommit?.(nextPriceRange);
  };

  return (
    <div className="mt-2 min-w-0" aria-label="예산 범위 설정">
      <div className="flex items-center justify-between gap-3 text-body-sm">
        <span className="font-semibold text-foreground">예산</span>
        <output className="font-bold whitespace-nowrap text-foreground" aria-live="polite">
          {formatPrice(draftMinPrice)} ~ {formatPrice(draftMaxPrice)}
        </output>
      </div>

      <div className="relative -mt-1 h-11">
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-disabled"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-[9px] left-[9px] h-1 -translate-y-1/2"
        >
          <div className="absolute inset-y-0 rounded-full bg-primary" style={selectedRangeStyle} />
        </div>

        <input
          type="range"
          aria-label="최소 예산"
          aria-invalid={!isRangeValid}
          aria-valuetext={formatPrice(draftMinPrice)}
          min={availableMinPrice}
          max={availableMaxPrice}
          step={step}
          value={draftMinPrice}
          onChange={handleMinPriceChange}
          onPointerUp={commitPriceRange}
          onKeyUp={commitPriceRange}
          className={`${styles.sliderInput} z-20`}
        />
        <input
          type="range"
          aria-label="최대 예산"
          aria-invalid={!isRangeValid}
          aria-valuetext={formatPrice(draftMaxPrice)}
          min={availableMinPrice}
          max={availableMaxPrice}
          step={step}
          value={draftMaxPrice}
          onChange={handleMaxPriceChange}
          onPointerUp={commitPriceRange}
          onKeyUp={commitPriceRange}
          className={`${styles.sliderInput} ${styles.maximumInput} z-30`}
        />
      </div>

      <div className="-mt-2 flex justify-between text-caption text-foreground-secondary">
        <span>{formatPrice(availableMinPrice)}</span>
        <span>{formatPrice(availableMaxPrice)}</span>
      </div>
    </div>
  );
}
