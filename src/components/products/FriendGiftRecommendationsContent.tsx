// 친구 추천 대상과 가격 조건에 맞는 선물 상품 목록을 연결하는 콘텐츠
"use client";

import { useCallback, useEffect, useState } from "react";

import GiftRecommendationsList from "@/components/products/GiftRecommendationsList";
import ProductCategoryBadges from "@/components/products/ProductCategoryBadges";
import type {
  AvailablePriceRangeState,
  PriceRange,
} from "@/components/recommendations/PriceRangeSlider";
import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import type { GiftRecommendationsPriceRange } from "@/lib/api/giftRecommendations";
import { ALL_PRODUCT_CATEGORY_CODE, type ProductCategory } from "@/lib/productCategories";
import {
  INITIAL_PRODUCT_LIST_PRICE_RANGE_STATE,
  readProductListFilter,
  saveProductListFilter,
} from "@/stores/productListRestoreStore";
import type { RecommendationTarget as RecommendationTargetData } from "@/types/recommendation";

type FriendGiftRecommendationsContentProps = {
  target: RecommendationTargetData;
  categories: readonly ProductCategory[];
};

export default function FriendGiftRecommendationsContent({
  target,
  categories,
}: FriendGiftRecommendationsContentProps) {
  const productListId = `friend:${target.userId}`;
  // 상세 화면에서 뒤로 가기로 돌아오면 이 기록에 저장해 둔 필터로 첫 렌더링을 시작함
  const [restoredFilter] = useState(() => readProductListFilter(productListId));
  const restoredPriceRange =
    restoredFilter?.priceRanges.friend ?? INITIAL_PRODUCT_LIST_PRICE_RANGE_STATE;
  const [availablePriceRangeState, setAvailablePriceRangeState] =
    useState<AvailablePriceRangeState>(restoredPriceRange.available);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(
    restoredPriceRange.selected,
  );
  const [appliedPriceRange, setAppliedPriceRange] = useState<PriceRange | null>(
    restoredPriceRange.applied,
  );
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>(
    restoredFilter?.selectedCategoryCode ?? ALL_PRODUCT_CATEGORY_CODE,
  );

  useEffect(() => {
    saveProductListFilter(productListId, {
      selectedCategoryCode,
      priceRanges: {
        friend: {
          available: availablePriceRangeState,
          selected: selectedPriceRange,
          applied: appliedPriceRange,
        },
      },
    });
  }, [
    appliedPriceRange,
    availablePriceRangeState,
    productListId,
    selectedCategoryCode,
    selectedPriceRange,
  ]);

  const handleAvailablePriceRangeLoad = useCallback(
    (priceRange: GiftRecommendationsPriceRange | null) => {
      setAvailablePriceRangeState({ status: "loaded", priceRange });
      setSelectedPriceRange(priceRange);
    },
    [],
  );
  const availablePriceRange =
    availablePriceRangeState.status === "loaded" ? availablePriceRangeState.priceRange : null;

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
          isBudgetLoading={availablePriceRangeState.status === "loading"}
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
