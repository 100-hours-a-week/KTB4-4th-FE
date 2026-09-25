// 메인 페이지 맞춤 상품의 요약 정보를 표시하는 카드

import type { PersonalRecommendation } from "@/lib/api/personalRecommendations";

type HomeProductCardProps = {
  product: PersonalRecommendation;
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function HomeProductCard({ product }: HomeProductCardProps) {
  return (
    <article className="min-w-0 rounded-sm border border-border-strong bg-surface p-2">
      {/* TODO: 상품 추천 API의 imageUrl이 있으면 실제 상품 이미지로 교체 */}
      <div
        role="img"
        aria-label={`${product.name} 상품 이미지`}
        className="aspect-square w-full bg-disabled"
      />

      <h3 className="mt-3 truncate text-body-sm font-medium text-foreground">{product.name}</h3>
      <p className="mt-1 text-body font-bold whitespace-nowrap text-foreground">
        {formatPrice(product.price)}
      </p>
    </article>
  );
}
