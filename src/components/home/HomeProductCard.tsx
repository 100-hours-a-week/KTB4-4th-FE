// 메인 페이지 맞춤 상품의 요약 정보를 표시하는 카드

import Image from "next/image";
import Link from "next/link";

import type { PersonalRecommendation } from "@/lib/api/personalRecommendations";

type HomeProductCardProps = {
  product: PersonalRecommendation;
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function HomeProductCard({ product }: HomeProductCardProps) {
  return (
    <Link
      href={`/products/${product.productId}?context=PERSONAL`}
      className="min-w-0 rounded-sm border border-border-strong bg-surface p-2"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-disabled">
        {product.productImageUrl && (
          // CSS 배경 이미지와 달리 HTML 해석 단계에서 바로 발견되도록 이미지 요소로 렌더링하고,
          // 첫 화면 상품 이미지라 지연 로딩 없이 높은 우선순위로 요청
          <Image
            src={product.productImageUrl}
            alt={`${product.name} 상품 이미지`}
            fill
            unoptimized
            loading="eager"
            fetchPriority="high"
            className="object-cover"
          />
        )}
      </div>

      <h3 className="mt-3 truncate text-body-sm font-medium text-foreground">{product.name}</h3>
      <p className="mt-1 text-body font-bold whitespace-nowrap text-foreground">
        {formatPrice(product.price)}
      </p>
    </Link>
  );
}
