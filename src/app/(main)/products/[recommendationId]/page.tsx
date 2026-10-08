// 추천 대상에 맞는 상품 상세 정보를 표시하는 페이지

import { redirect } from "next/navigation";

import PersonalProductDetailContent from "@/components/products/PersonalProductDetailContent";

type ProductDetailPageProps = {
  params: Promise<{ recommendationId: string }>;
  searchParams: Promise<{
    targetType?: string;
    targetUserId?: string;
  }>;
};

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { recommendationId } = await params;
  const { targetType, targetUserId } = await searchParams;
  const parsedRecommendationId = Number(recommendationId);

  if (!Number.isSafeInteger(parsedRecommendationId) || parsedRecommendationId <= 0) {
    redirect("/error");
  }

  if (targetType === "FRIEND") {
    const parsedTargetUserId = Number(targetUserId);

    if (!Number.isSafeInteger(parsedTargetUserId) || parsedTargetUserId <= 0) {
      redirect("/error");
    }

    return (
      <main
        aria-label="친구 추천 상품 상세"
        className="page-content flex flex-1 flex-col bg-background pb-[max(2rem,env(safe-area-inset-bottom))]"
      >
        <PersonalProductDetailContent
          recommendationId={parsedRecommendationId}
          targetType="FRIEND"
          targetUserId={parsedTargetUserId}
        />
      </main>
    );
  }

  if (targetType !== undefined) {
    redirect("/error");
  }

  return (
    <main
      aria-label="상품 상세"
      className="page-content flex flex-1 flex-col bg-background pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <PersonalProductDetailContent recommendationId={parsedRecommendationId} />
    </main>
  );
}
