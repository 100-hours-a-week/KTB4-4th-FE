// 내 추천 상품의 상세 정보를 표시하는 페이지

import { redirect } from "next/navigation";

import PersonalProductDetailContent from "@/components/products/PersonalProductDetailContent";

type PersonalProductDetailPageProps = {
  params: Promise<{ recommendationId: string }>;
};

export default async function PersonalProductDetailPage({
  params,
}: PersonalProductDetailPageProps) {
  const { recommendationId } = await params;
  const parsedRecommendationId = Number(recommendationId);

  if (!Number.isSafeInteger(parsedRecommendationId) || parsedRecommendationId <= 0) {
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
