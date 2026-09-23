// 친구 추천 대상과 가격 조건에 맞는 선물 상품 목록을 연결하는 콘텐츠
"use client";

import { useState } from "react";

import FriendGiftRecommendationsList from "@/components/products/FriendGiftRecommendationsList";
import type { PriceRange } from "@/components/recommendations/PriceRangeSlider";
import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import type { RecommendationTarget as RecommendationTargetData } from "@/types/recommendation";

type FriendGiftRecommendationsContentProps = {
  target: RecommendationTargetData;
  availableMinPrice: number;
  availableMaxPrice: number;
};

export default function FriendGiftRecommendationsContent({
  target,
  availableMinPrice,
  availableMaxPrice,
}: FriendGiftRecommendationsContentProps) {
  const [priceRange, setPriceRange] = useState<PriceRange>({
    minPrice: availableMinPrice,
    maxPrice: availableMaxPrice,
  });

  const handlePriceRangeCommit = (nextPriceRange: PriceRange) => {
    setPriceRange((currentPriceRange) => {
      if (
        currentPriceRange.minPrice === nextPriceRange.minPrice &&
        currentPriceRange.maxPrice === nextPriceRange.maxPrice
      ) {
        return currentPriceRange;
      }

      return nextPriceRange;
    });
  };

  return (
    <>
      <section aria-label="추천 대상" className="w-full pt-8">
        <RecommendationTarget
          target={target}
          availableMinPrice={availableMinPrice}
          availableMaxPrice={availableMaxPrice}
          onPriceRangeCommit={handlePriceRangeCommit}
        />
      </section>

      <section aria-label="추천 상품 목록" className="flex w-full flex-col gap-4 py-5">
        <FriendGiftRecommendationsList
          userId={target.userId}
          minPrice={priceRange.minPrice}
          maxPrice={priceRange.maxPrice}
        />
      </section>
    </>
  );
}
