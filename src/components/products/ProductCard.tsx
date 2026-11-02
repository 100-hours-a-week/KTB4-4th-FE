// 추천 상품의 기본 정보를 표시하고, 표시 값이 같으면 다시 렌더링하지 않는 카드 컴포넌트

import Link from "next/link";
import { memo } from "react";

import PerfProfiler from "@/components/perf/PerfProfiler";
import { getProductCategoryName } from "@/lib/productCategories";

type ProductCardProps = {
  product: {
    name: string;
    category: string;
    price: number;
    productImageUrl: string | null;
    purchaseUrl: string;
  };
  detailHref?: string;
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

function ProductCardContent({ product, detailHref }: ProductCardProps) {
  const content = (
    <>
      <div
        role="img"
        aria-label={`${product.name} 상품 이미지`}
        className="aspect-square w-full rounded-md bg-disabled bg-cover bg-center bg-no-repeat"
        style={
          product.productImageUrl
            ? { backgroundImage: `url(${JSON.stringify(product.productImageUrl)})` }
            : undefined
        }
      />

      <div className="mt-2 min-w-0">
        <p className="truncate text-body-sm font-bold text-foreground">
          {getProductCategoryName(product.category)}
        </p>
        <h2 className="mt-0.5 line-clamp-2 text-body-sm font-medium text-muted">{product.name}</h2>
        <p className="mt-0.5 text-body font-bold text-foreground">{formatPrice(product.price)}</p>
      </div>
    </>
  );

  const className = "flex w-full min-w-0 flex-col";

  if (detailHref) {
    return (
      <Link href={detailHref} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
}

// 렌더링을 건너뛴 카드는 update로 기록되지 않도록 Profiler를 memo 안쪽에 둠
function ProfiledProductCard(props: ProductCardProps) {
  return (
    <PerfProfiler id="product-card">
      <ProductCardContent {...props} />
    </PerfProfiler>
  );
}

// 조건 변경으로 상품 객체가 새로 만들어져도 표시 값이 같으면 렌더링을 건너뛰도록 값으로 비교함
// 카드에 표시하는 상품 필드를 추가하면 이 비교에도 함께 추가해야 함
function areProductCardPropsEqual(prev: ProductCardProps, next: ProductCardProps) {
  return (
    prev.detailHref === next.detailHref &&
    prev.product.name === next.product.name &&
    prev.product.category === next.product.category &&
    prev.product.price === next.product.price &&
    prev.product.productImageUrl === next.product.productImageUrl &&
    prev.product.purchaseUrl === next.product.purchaseUrl
  );
}

export default memo(ProfiledProductCard, areProductCardPropsEqual);
