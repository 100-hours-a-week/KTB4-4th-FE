// 내 추천 상품의 전체 가격 범위와 선택 예산을 연결하는 콘텐츠
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import SegmentedTabs, { type SegmentedTabItem } from "@/components/common/SegmentedTabs";
import PersonalRecommendationsList from "@/components/products/PersonalRecommendationsList";
import type { PriceRange } from "@/components/recommendations/PriceRangeSlider";
import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import { ApiRequestError } from "@/lib/api/client";
import { checkLoginValidity, type LoginValidityData } from "@/lib/api/loginValidity";
import type { PersonalRecommendationsPriceRange } from "@/lib/api/personalRecommendations";
import type { RecommendationTarget as RecommendationTargetData } from "@/types/recommendation";

type ProductVisibilityTab = "private" | "shared";

export default function PersonalRecommendationsContent() {
  const router = useRouter();
  const [selectedVisibilityTab, setSelectedVisibilityTab] =
    useState<ProductVisibilityTab>("private");
  const [loginUser, setLoginUser] = useState<LoginValidityData["user"] | null>(null);
  const [availablePriceRange, setAvailablePriceRange] =
    useState<PersonalRecommendationsPriceRange | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);
  const [appliedPriceRange, setAppliedPriceRange] = useState<PriceRange | null>(null);

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

  const handleAvailablePriceRangeLoad = useCallback(
    (priceRange: PersonalRecommendationsPriceRange | null) => {
      setAvailablePriceRange(priceRange);
      setSelectedPriceRange(priceRange);
    },
    [],
  );

  const handlePriceRangeCommit = (priceRange: PriceRange) => {
    setSelectedPriceRange(priceRange);
    setAppliedPriceRange(priceRange);
  };

  if (!loginUser) {
    return (
      <p role="status" className="pt-8 text-center text-body-sm text-muted">
        사용자 정보를 불러오는 중이에요.
      </p>
    );
  }

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
          availableMinPrice={availablePriceRange?.minPrice}
          availableMaxPrice={availablePriceRange?.maxPrice}
          initialMinPrice={selectedPriceRange?.minPrice}
          initialMaxPrice={selectedPriceRange?.maxPrice}
          showBudget={availablePriceRange !== null}
          onPriceRangeCommit={handlePriceRangeCommit}
        />
      </section>

      <section aria-label="추천 상품 목록" className="flex w-full flex-col gap-4 py-5">
        {/* TODO: 공개 범위 API 명세 확정 후 selectedVisibilityTab을 상품 목록 조회 조건으로 전달 */}
        <PersonalRecommendationsList
          minPrice={appliedPriceRange?.minPrice}
          maxPrice={appliedPriceRange?.maxPrice}
          onPriceRangeLoad={appliedPriceRange === null ? handleAvailablePriceRangeLoad : undefined}
        />
      </section>
    </>
  );
}
