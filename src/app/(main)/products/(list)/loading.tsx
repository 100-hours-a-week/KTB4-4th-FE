// 상품 추천 목록으로 이동하는 동안 표시하는 스켈레톤 로딩 화면 (라우트 그룹으로 상품 상세에는 적용되지 않음)
// 이동 대상(내 추천·친구 추천)을 알 수 없으므로 두 화면에 공통으로 있는 영역만 표시함

import ProductCategoryBadgesSkeleton from "@/components/products/ProductCategoryBadgesSkeleton";
import ProductGridSkeleton from "@/components/products/ProductGridSkeleton";
import RecommendationTargetSkeleton from "@/components/recommendations/RecommendationTargetSkeleton";

export default function ProductsLoading() {
  return (
    <main
      aria-label="상품 추천"
      aria-busy="true"
      className="page-content flex flex-1 flex-col bg-background pb-[calc(var(--spacing-bottom-nav-overlap)+var(--spacing-page))]"
    >
      <section className="w-full pt-8">
        <RecommendationTargetSkeleton />
      </section>

      <section className="flex w-full flex-col gap-4 py-5">
        <ProductCategoryBadgesSkeleton />
        <ProductGridSkeleton />
      </section>
    </main>
  );
}
