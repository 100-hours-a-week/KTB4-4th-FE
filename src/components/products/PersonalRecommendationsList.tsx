// 내 추천 상품을 커서 기반 무한 스크롤로 표시하는 목록
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import PerfProfiler from "@/components/perf/PerfProfiler";
import EmptyRecommendedProducts from "@/components/products/EmptyRecommendedProducts";
import ProductCard from "@/components/products/ProductCard";
import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";
import ProductGridSkeleton, {
  PRODUCT_SKELETON_COUNT,
} from "@/components/products/ProductGridSkeleton";
import { usePersonalRecommendationsQuery } from "@/hooks/usePersonalRecommendationsQuery";
import { useProductListFirstPagePerfMarks } from "@/hooks/useProductListPerfMarks";
import { ApiRequestError } from "@/lib/api/client";
import type { PersonalRecommendationsPriceRange } from "@/lib/api/personalRecommendations";

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
      <div
        aria-busy={isPlaceholderData}
        className={`grid grid-cols-3 gap-x-2 gap-y-5 ${isPlaceholderData ? "opacity-50" : ""}`}
      >
        {products.map((product) => (
          <ProductCard
            key={product.recommendationId}
            product={product}
            detailHref={`/products/${product.productId}?context=PERSONAL`}
          />
        ))}
        {/* 다음 페이지 카드가 들어올 칸에 바로 스켈레톤을 두어 같은 위치에서 교체되게 함 */}
        {isFetchingNextPage &&
          Array.from({ length: PRODUCT_SKELETON_COUNT }, (_, index) => (
            <ProductCardSkeleton key={`next-page-skeleton-${index}`} />
          ))}
      </div>

      {hasNextPage && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {isFetchingNextPage && (
        <p role="status" className="sr-only">
          추천 상품을 불러오는 중이에요.
        </p>
      )}
    </>
  );
}
