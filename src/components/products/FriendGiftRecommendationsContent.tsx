// 친구 추천 대상과 가격 조건에 맞는 선물 상품 목록을 연결하는 콘텐츠
"use client";

import { useCallback, useState } from "react";

import GiftRecommendationsList from "@/components/products/GiftRecommendationsList";
import ProductCategoryBadges from "@/components/products/ProductCategoryBadges";
import type { PriceRange } from "@/components/recommendations/PriceRangeSlider";
import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import type { GiftRecommendationsPriceRange } from "@/lib/api/giftRecommendations";
import { ALL_PRODUCT_CATEGORY_CODE, type ProductCategory } from "@/lib/productCategories";
import type { RecommendationTarget as RecommendationTargetData } from "@/types/recommendation";

type FriendGiftRecommendationsContentProps = {
  target: RecommendationTargetData;
  categories: readonly ProductCategory[];
};

export default function FriendGiftRecommendationsContent({
  target,
  categories,
}: FriendGiftRecommendationsContentProps) {
  const [availablePriceRange, setAvailablePriceRange] =
    useState<GiftRecommendationsPriceRange | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);
  const [appliedPriceRange, setAppliedPriceRange] = useState<PriceRange | null>(null);
  const [selectedCategoryCode, setSelectedCategoryCode] =
    useState<string>(ALL_PRODUCT_CATEGORY_CODE);

  const handleAvailablePriceRangeLoad = useCallback(
    (priceRange: GiftRecommendationsPriceRange | null) => {
      setAvailablePriceRange(priceRange);
      setSelectedPriceRange(priceRange);
    },
    [],
  );

  const handlePriceRangeCommit = (nextPriceRange: PriceRange) => {
    setSelectedPriceRange(nextPriceRange);
    setAppliedPriceRange(nextPriceRange);
  };

  return (
    <>
      <section aria-label="추천 대상" className="w-full pt-8">
        <RecommendationTarget
          target={target}
          availableMinPrice={availablePriceRange?.minPrice}
          availableMaxPrice={availablePriceRange?.maxPrice}
          initialMinPrice={selectedPriceRange?.minPrice}
          initialMaxPrice={selectedPriceRange?.maxPrice}
          showBudget={availablePriceRange !== null}
          onPriceRangeCommit={handlePriceRangeCommit}
        />
      </section>

      <section aria-label="추천 상품 목록" className="flex w-full flex-col gap-4 py-5">
        <ProductCategoryBadges
          categories={categories}
          value={selectedCategoryCode}
          onChange={setSelectedCategoryCode}
        />
        <GiftRecommendationsList
          target={{ type: "FRIEND", userId: target.userId }}
          category={
            selectedCategoryCode === ALL_PRODUCT_CATEGORY_CODE ? undefined : selectedCategoryCode
          }
          minPrice={appliedPriceRange?.minPrice}
          maxPrice={appliedPriceRange?.maxPrice}
          onPriceRangeLoad={appliedPriceRange === null ? handleAvailablePriceRangeLoad : undefined}
        />
      </section>
    </>
  );
}
