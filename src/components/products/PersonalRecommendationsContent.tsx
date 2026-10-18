// 내 추천 상품의 전체 가격 범위와 선택 예산을 연결하는 콘텐츠
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import SegmentedTabs, { type SegmentedTabItem } from "@/components/common/SegmentedTabs";
import GiftRecommendationsList from "@/components/products/GiftRecommendationsList";
import PersonalRecommendationsList from "@/components/products/PersonalRecommendationsList";
import ProductCategoryBadges from "@/components/products/ProductCategoryBadges";
import type { PriceRange } from "@/components/recommendations/PriceRangeSlider";
import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import { ApiRequestError } from "@/lib/api/client";
import { checkLoginValidity, type LoginValidityData } from "@/lib/api/loginValidity";
import { ALL_PRODUCT_CATEGORY_CODE, type ProductCategory } from "@/lib/productCategories";
import type { RecommendationTarget as RecommendationTargetData } from "@/types/recommendation";

type ProductVisibilityTab = "private" | "shared";

type TabPriceRangeState = {
  available: PriceRange | null;
  selected: PriceRange | null;
  applied: PriceRange | null;
};

const INITIAL_TAB_PRICE_RANGE_STATE: TabPriceRangeState = {
  available: null,
  selected: null,
  applied: null,
};

type PersonalRecommendationsContentProps = {
  categories: readonly ProductCategory[];
};

export default function PersonalRecommendationsContent({
  categories,
}: PersonalRecommendationsContentProps) {
  const router = useRouter();
  const [selectedVisibilityTab, setSelectedVisibilityTab] =
    useState<ProductVisibilityTab>("private");
  const [loginUser, setLoginUser] = useState<LoginValidityData["user"] | null>(null);
  const [priceRangesByTab, setPriceRangesByTab] = useState<
    Record<ProductVisibilityTab, TabPriceRangeState>
  >({
    private: INITIAL_TAB_PRICE_RANGE_STATE,
    shared: INITIAL_TAB_PRICE_RANGE_STATE,
  });
  const [selectedCategoryCode, setSelectedCategoryCode] =
    useState<string>(ALL_PRODUCT_CATEGORY_CODE);

  useEffect(() => {
    let isActive = true;

    checkLoginValidity()
      .then(({ user }) => {
        if (isActive) {
          setLoginUser(user);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        router.replace(
          error instanceof ApiRequestError && error.status === 401 ? "/login" : "/error",
        );
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  const updateTabPriceRange = useCallback(
    (tab: ProductVisibilityTab, nextState: Partial<TabPriceRangeState>) => {
      setPriceRangesByTab((currentPriceRanges) => ({
        ...currentPriceRanges,
        [tab]: { ...currentPriceRanges[tab], ...nextState },
      }));
    },
    [],
  );

  const handlePrivatePriceRangeLoad = useCallback(
    (priceRange: PriceRange | null) => {
      updateTabPriceRange("private", { available: priceRange, selected: priceRange });
    },
    [updateTabPriceRange],
  );

  const handleSharedPriceRangeLoad = useCallback(
    (priceRange: PriceRange | null) => {
      updateTabPriceRange("shared", { available: priceRange, selected: priceRange });
    },
    [updateTabPriceRange],
  );

  const handlePriceRangeCommit = (priceRange: PriceRange) => {
    updateTabPriceRange(selectedVisibilityTab, { selected: priceRange, applied: priceRange });
  };

  if (!loginUser) {
    return (
      <p role="status" className="pt-8 text-center text-body-sm text-muted">
        사용자 정보를 불러오는 중이에요.
      </p>
    );
  }

  const privatePriceRange = priceRangesByTab.private;
  const sharedPriceRange = priceRangesByTab.shared;
  const currentPriceRange = priceRangesByTab[selectedVisibilityTab];
  const selfTarget = {
    type: "SELF",
    userId: loginUser.id,
    name: loginUser.nickname,
    profileImageUrl: loginUser.profileImageUrl,
    tasteKeywords: [],
    interestKeywords: [],
  } satisfies RecommendationTargetData;
  const productVisibilityTabs: readonly SegmentedTabItem<ProductVisibilityTab>[] = [
    {
      value: "private",
      label: (
        <span className="flex min-w-0 items-center justify-center whitespace-nowrap text-body-sm">
          <span className="min-w-0 truncate text-info">{loginUser.nickname}</span>
          <span className="shrink-0">님만 볼 수 있는 상품</span>
        </span>
      ),
    },
    {
      value: "shared",
      label: <span className="whitespace-nowrap text-body-sm">친구에게 보여지는 상품</span>,
    },
  ];

  return (
    <>
      <section aria-label="추천 대상" className="w-full pt-8">
        <SegmentedTabs
          items={productVisibilityTabs}
          value={selectedVisibilityTab}
          onChange={setSelectedVisibilityTab}
          ariaLabel="상품 공개 범위"
          className="mb-4"
        />
        <RecommendationTarget
          target={selfTarget}
          availableMinPrice={currentPriceRange.available?.minPrice}
          availableMaxPrice={currentPriceRange.available?.maxPrice}
          initialMinPrice={currentPriceRange.selected?.minPrice}
          initialMaxPrice={currentPriceRange.selected?.maxPrice}
          showBudget={currentPriceRange.available !== null}
          onPriceRangeCommit={handlePriceRangeCommit}
        />
      </section>

      <section aria-label="추천 상품 목록" className="flex w-full flex-col gap-4 py-5">
        <ProductCategoryBadges
          categories={categories}
          value={selectedCategoryCode}
          onChange={setSelectedCategoryCode}
        />
        {selectedVisibilityTab === "private" ? (
          <PersonalRecommendationsList
            category={
              selectedCategoryCode === ALL_PRODUCT_CATEGORY_CODE ? undefined : selectedCategoryCode
            }
            minPrice={privatePriceRange.applied?.minPrice}
            maxPrice={privatePriceRange.applied?.maxPrice}
            onPriceRangeLoad={
              privatePriceRange.applied === null ? handlePrivatePriceRangeLoad : undefined
            }
          />
        ) : (
          <GiftRecommendationsList
            target={{ type: "SELF" }}
            category={
              selectedCategoryCode === ALL_PRODUCT_CATEGORY_CODE ? undefined : selectedCategoryCode
            }
            minPrice={sharedPriceRange.applied?.minPrice}
            maxPrice={sharedPriceRange.applied?.maxPrice}
            onPriceRangeLoad={
              sharedPriceRange.applied === null ? handleSharedPriceRangeLoad : undefined
            }
          />
        )}
      </section>
    </>
  );
}
