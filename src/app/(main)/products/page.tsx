// 추천 대상의 문맥에 맞는 상품 추천 화면

import { redirect } from "next/navigation";

import FriendRecommendationContent from "@/components/products/FriendRecommendationContent";
import PersonalRecommendationsContent from "@/components/products/PersonalRecommendationsContent";

// TODO: 친구 추천 API 응답의 최소·최대 가격 메타데이터로 교체
const temporaryFriendAvailablePriceRange = {
  minimum: 10_000,
  maximum: 50_000,
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
          availableMinPrice={temporaryFriendAvailablePriceRange.minimum}
          availableMaxPrice={temporaryFriendAvailablePriceRange.maximum}
        />
      </main>
    );
  }

  return (
    <main aria-label="상품 추천" className="page-content flex flex-1 flex-col bg-background-subtle">
      <PersonalRecommendationsContent />
    </main>
  );
}
