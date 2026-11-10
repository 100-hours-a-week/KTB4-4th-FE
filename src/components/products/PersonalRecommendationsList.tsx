// 내 추천 상품을 커서 기반 무한 스크롤로 표시하는 목록
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import PerfProfiler from "@/components/perf/PerfProfiler";
import EmptyRecommendedProducts from "@/components/products/EmptyRecommendedProducts";
import ProductCard from "@/components/products/ProductCard";
import ProductGridSkeleton, {
  PRODUCT_SKELETON_COUNT,
} from "@/components/products/ProductGridSkeleton";
import VirtualProductGrid from "@/components/products/VirtualProductGrid";
import { usePersonalRecommendationsQuery } from "@/hooks/usePersonalRecommendationsQuery";
import { useProductListFirstPagePerfMarks } from "@/hooks/useProductListPerfMarks";
import { ApiRequestError } from "@/lib/api/client";
import type { PersonalRecommendationsPriceRange } from "@/lib/api/personalRecommendations";

// 첫 화면에 보이는 두 줄(3열) 카드 이미지는 지연 로딩 없이 바로 요청함
const EAGER_IMAGE_COUNT = 6;

type PersonalRecommendationsListProps = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  onPriceRangeLoad?: (priceRange: PersonalRecommendationsPriceRange | null) => void;
};

export default function PersonalRecommendationsList(props: PersonalRecommendationsListProps) {
  return (
    // 조건이 바뀌어도 목록을 유지하므로 Profiler에 key를 두지 않아 update로 기록되도록 함
    <PerfProfiler id="personal-recommendations-list">
      <PersonalRecommendationsListContent {...props} />
    </PerfProfiler>
  );
}

function PersonalRecommendationsListContent({
  category,
  minPrice,
  maxPrice,
  onPriceRangeLoad,
}: PersonalRecommendationsListProps) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isPending,
    isPlaceholderData,
  } = usePersonalRecommendationsQuery({ category, minPrice, maxPrice });
  const products = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  // 이전 조건의 목록을 유지해 표시하는 동안에는 현재 조건의 첫 페이지가 아직 없는 것으로 봄
  const firstPage = isPlaceholderData ? undefined : data?.pages[0];

  useProductListFirstPagePerfMarks(firstPage);

  // 캐시에서 바로 보여 준 경우를 포함해 현재 조건의 첫 페이지가 바뀌면 가격 범위를 다시 알림
  useEffect(() => {
    if (firstPage) {
      onPriceRangeLoad?.(firstPage.priceRange);
    }
  }, [firstPage, onPriceRangeLoad]);

  useEffect(() => {
    // TODO: 429 응답의 Retry-After 또는 retryAfterSeconds를 활용한 재시도 안내 연동
    if (error) {
      router.replace(
        error instanceof ApiRequestError && error.status === 401 ? "/login" : "/error",
      );
    }
  }, [error, router]);

  // 요청 중에는 감시를 멈추고, 요청이 끝난 뒤 다시 감시해 감지 지점이 계속 보이면 다음 페이지를 이어 불러옴
  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNextPage || isFetching) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  // 첫 페이지를 받기 전에는 카드 자리를 스켈레톤으로 표시하고, 상태 문구는 스크린 리더에만 전달함
  if (isPending) {
    return (
      <>
        <p role="status" className="sr-only">
          추천 상품을 불러오는 중이에요.
        </p>
        <ProductGridSkeleton />
      </>
    );
  }

  if (!isPlaceholderData && !error && products.length === 0) {
    return <EmptyRecommendedProducts />;
  }

  return (
    <>
      {/* 새 조건의 목록을 기다리는 동안 이전 목록을 흐리게 유지함 */}
      <VirtualProductGrid
        items={products}
        skeletonCount={isFetchingNextPage ? PRODUCT_SKELETON_COUNT : 0}
        isDimmed={isPlaceholderData}
        getItemKey={(product) => product.recommendationId}
        renderItem={(product, index) => (
          <ProductCard
            product={product}
            detailHref={`/products/${product.productId}?context=PERSONAL`}
            // LCP 후보인 첫 카드만 우선순위를 높여 나머지 카드와 대역폭을 나눠 쓰지 않게 함
            imagePriority={index === 0 ? "high" : "auto"}
            imageLoading={index < EAGER_IMAGE_COUNT ? "eager" : "lazy"}
          />
        )}
      />

      {hasNextPage && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {isFetchingNextPage && (
        <p role="status" className="sr-only">
          추천 상품을 불러오는 중이에요.
        </p>
      )}
    </>
  );
}
