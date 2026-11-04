// 추천 상품의 기본 정보를 표시하고, 표시 값이 같으면 다시 렌더링하지 않는 카드 컴포넌트
"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";

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

// empty: 이미지 주소 없음, loading: 받는 중, loaded: 받음, error: 받기 실패
type ImageStatus = "empty" | "loading" | "loaded" | "error";

type ImageResult = {
  src: string;
  status: "loaded" | "error";
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

function ProductCardContent({ product, detailHref }: ProductCardProps) {
  const imageUrl = product.productImageUrl;
  const imageAlt = `${product.name} 상품 이미지`;
  // 이미지 주소가 바뀌면 이전 주소의 결과를 쓰지 않도록 결과를 주소와 함께 저장함
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const imageStatus: ImageStatus = !imageUrl
    ? "empty"
    : imageResult?.src === imageUrl
      ? imageResult.status
      : "loading";
  const hasVisibleImage = imageStatus === "loading" || imageStatus === "loaded";

  const content = (
    <>
      {/* 이미지가 없거나 받지 못한 상품도 같은 이름으로 읽히도록 영역 자체를 이미지로 표시함 */}
      <div
        role={hasVisibleImage ? undefined : "img"}
        aria-label={hasVisibleImage ? undefined : imageAlt}
        className="relative aspect-square w-full overflow-hidden rounded-md bg-disabled"
      >
        {/* 이미지를 숨기면 하이드레이션 전까지 그려지지 않아 LCP가 늦어지므로, 스켈레톤을 이미지 아래층에 둠 */}
        {imageStatus === "loading" && (
          <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-background-subtle" />
        )}
        {imageUrl && hasVisibleImage && (
          // CSS 배경 이미지는 로딩 화면 뒤 스트리밍 조각 안에서 교체 스크립트 이후에 요청되므로,
          // HTML을 읽는 즉시 요청되도록 이미지 요소로 렌더링함
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            unoptimized
            loading="eager"
            sizes="33vw"
            className="object-cover"
            // 하이드레이션 전에 실패한 이미지도 next/image가 onLoad로 알려주므로 실제 크기로 성공 여부를 판단함
            onLoad={(event) =>
              setImageResult({
                src: imageUrl,
                status: event.currentTarget.naturalWidth > 0 ? "loaded" : "error",
              })
            }
            onError={() => setImageResult({ src: imageUrl, status: "error" })}
          />
        )}
      </div>

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
