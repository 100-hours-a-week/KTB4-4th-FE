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

// 목록 첫 페이지를 받기 전(loading)과 받은 뒤 가격 범위가 없는 경우(loaded + null)를 구분하는 상태
export type AvailablePriceRangeState =
  { status: "loading" } | { status: "loaded"; priceRange: PriceRange | null };

type RangeThumb = "minimum" | "maximum";

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
  const [lastCommittedRange, setLastCommittedRange] = useState<PriceRange>({
    minPrice: clampedInitialMinPrice,
    maxPrice: clampedInitialMaxPrice,
  });
  const [syncedInitialRange, setSyncedInitialRange] = useState<PriceRange>({
    minPrice: clampedInitialMinPrice,
    maxPrice: clampedInitialMaxPrice,
  });
  const activeThumbRef = useRef<RangeThumb | null>(null);

  // 탭 전환 등으로 바깥 선택 가격이 바뀌면 슬라이더를 새로 만들지 않고 내부 값만 맞춤
  if (
    syncedInitialRange.minPrice !== clampedInitialMinPrice ||
    syncedInitialRange.maxPrice !== clampedInitialMaxPrice
  ) {
    const nextInitialRange = {
      minPrice: clampedInitialMinPrice,
      maxPrice: clampedInitialMaxPrice,
    };

    setSyncedInitialRange(nextInitialRange);
    setLastCommittedRange(nextInitialRange);
    setDraftMinPrice(nextInitialRange.minPrice);
    setDraftMaxPrice(nextInitialRange.maxPrice);
  }

  const isFixedRange = availableMinPrice === availableMaxPrice;
  const isRangeValid = draftMinPrice <= draftMaxPrice;
  const normalizedStep = Math.max(step, 1);
  const maximumStepIndex = isFixedRange
    ? 1
    : Math.ceil((availableMaxPrice - availableMinPrice) / normalizedStep);
  const getPriceFromStepIndex = (stepIndex: number) =>
    Math.min(availableMinPrice + stepIndex * normalizedStep, availableMaxPrice);
  const getStepIndexFromPrice = (price: number) => {
    if (isFixedRange) {
      return 0;
    }

    if (price >= availableMaxPrice) {
      return maximumStepIndex;
    }

    return Math.round((price - availableMinPrice) / normalizedStep);
  };
  const draftMinStepIndex = getStepIndexFromPrice(draftMinPrice);
  const draftMaxStepIndex = getStepIndexFromPrice(draftMaxPrice);
  const selectedRangeStyle = {
    left: `${(draftMinStepIndex / maximumStepIndex) * 100}%`,
    right: `${100 - (draftMaxStepIndex / maximumStepIndex) * 100}%`,
  } satisfies CSSProperties;

  const updateDraftPrice = (sourceThumb: RangeThumb, nextPrice: number) => {
    let activeThumb = activeThumbRef.current ?? sourceThumb;

    if (draftMinPrice === draftMaxPrice && activeThumbRef.current === null) {
      if (nextPrice < draftMinPrice) {
        activeThumb = "minimum";
      } else if (nextPrice > draftMaxPrice) {
        activeThumb = "maximum";
      }
    }

    activeThumbRef.current = activeThumb;

    if (activeThumb === "minimum") {
      setDraftMinPrice(Math.min(nextPrice, draftMaxPrice));
      return;
    }

    setDraftMaxPrice(Math.max(nextPrice, draftMinPrice));
  };

  const handleMinPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateDraftPrice("minimum", getPriceFromStepIndex(Number(event.target.value)));
  };

  const handleMaxPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateDraftPrice("maximum", getPriceFromStepIndex(Number(event.target.value)));
  };

  const commitPriceRange = () => {
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

    setLastCommittedRange(nextPriceRange);
    onPriceRangeCommit?.(nextPriceRange);
  };

  const handleInteractionEnd = () => {
    activeThumbRef.current = null;
    commitPriceRange();
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
          min={0}
          max={maximumStepIndex}
          step={1}
          value={draftMinStepIndex}
          disabled={isFixedRange}
          onChange={handleMinPriceChange}
          onPointerUp={handleInteractionEnd}
          onKeyUp={handleInteractionEnd}
          className={`${styles.sliderInput} z-20`}
        />
        <input
          type="range"
          aria-label="최대 예산"
          aria-invalid={!isRangeValid}
          aria-valuetext={formatPrice(draftMaxPrice)}
          min={0}
          max={maximumStepIndex}
          step={1}
          value={draftMaxStepIndex}
          disabled={isFixedRange}
          onChange={handleMaxPriceChange}
          onPointerUp={handleInteractionEnd}
          onKeyUp={handleInteractionEnd}
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
