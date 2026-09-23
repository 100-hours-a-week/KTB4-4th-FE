// 추천 대상의 문맥에 맞는 상품 추천 화면

import { redirect } from "next/navigation";

import FriendRecommendationContent from "@/components/products/FriendRecommendationContent";
import PersonalRecommendationsList from "@/components/products/PersonalRecommendationsList";
import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import { temporarySelfTarget } from "@/mocks/recommendationTargets";

// TODO: 추천 API 응답의 최소·최대 가격 메타데이터로 교체
const temporaryAvailablePriceRange = {
  minimum: 30_000,
  maximum: 80_000,
};

type ProductsPageProps = {
  searchParams: Promise<{
    targetType?: string;
    targetUserId?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { targetType, targetUserId } = await searchParams;

  if (targetType === "FRIEND") {
    const userId = Number(targetUserId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      redirect("/error");
    }

    return (
      <main
        aria-label="상품 추천"
        className="page-content flex flex-1 flex-col bg-background-subtle"
      >
        <FriendRecommendationContent
          userId={userId}
          availableMinPrice={temporaryAvailablePriceRange.minimum}
          availableMaxPrice={temporaryAvailablePriceRange.maximum}
        />
      </main>
    );
  }

  return (
    <main aria-label="상품 추천" className="page-content flex flex-1 flex-col bg-background-subtle">
      <section aria-label="추천 대상" className="w-full pt-8">
        <RecommendationTarget
          target={temporarySelfTarget}
          availableMinPrice={temporaryAvailablePriceRange.minimum}
          availableMaxPrice={temporaryAvailablePriceRange.maximum}
        />
      </section>

      <section aria-label="추천 상품 목록" className="flex w-full flex-col gap-4 py-5">
        <PersonalRecommendationsList />
      </section>
    </main>
  );
}
