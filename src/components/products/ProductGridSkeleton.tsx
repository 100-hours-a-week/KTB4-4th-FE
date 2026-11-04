// 추천 상품 목록의 첫 줄 카드 자리를 표시하는 스켈레톤 (추천 목록 그리드와 같은 간격)

import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";

const SKELETON_COUNT = 3;

export default function ProductGridSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-x-2 gap-y-5">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
