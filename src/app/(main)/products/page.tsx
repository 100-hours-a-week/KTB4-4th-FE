// 추천 대상의 문맥에 맞는 상품 추천 화면

import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import { temporaryFriends, temporarySelfTarget } from "@/mocks/recommendationTargets";

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
  const target =
    targetType === "FRIEND" && targetUserId
      ? (temporaryFriends[targetUserId] ?? temporarySelfTarget)
      : temporarySelfTarget;

  return (
    <main aria-label="상품 추천" className="page-content flex flex-1 bg-background-subtle">
      {/* TODO: targetType과 targetUserId를 기준으로 추천 API의 대상 정보 조회 */}
      <section aria-label="추천 대상" className="w-full pt-8">
        <RecommendationTarget
          target={target}
          availableMinPrice={temporaryAvailablePriceRange.minimum}
          availableMaxPrice={temporaryAvailablePriceRange.maximum}
        />
      </section>
    </main>
  );
}
