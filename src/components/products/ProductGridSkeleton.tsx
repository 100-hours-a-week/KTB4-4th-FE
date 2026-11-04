// 추천 상품 목록의 첫 줄 카드 자리를 표시하는 스켈레톤 (추천 목록 그리드와 같은 간격)

import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";

// 한 줄(3열) 분량으로, 다음 페이지를 불러올 때 목록 끝에 붙이는 카드 수로도 사용함
export const PRODUCT_SKELETON_COUNT = 3;

export default function ProductGridSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-x-2 gap-y-5">
      {Array.from({ length: PRODUCT_SKELETON_COUNT }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
