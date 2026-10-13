// 내 추천 상품을 커서 기반 무한 스크롤로 표시하는 목록
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import EmptyRecommendedProducts from "@/components/products/EmptyRecommendedProducts";
import ProductCard from "@/components/products/ProductCard";
import { ApiRequestError } from "@/lib/api/client";
import {
  getPersonalRecommendations,
  type PersonalRecommendation,
  type PersonalRecommendationsPriceRange,
} from "@/lib/api/personalRecommendations";

const PAGE_SIZE = 20;

type PersonalRecommendationsListProps = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  onPriceRangeLoad?: (priceRange: PersonalRecommendationsPriceRange | null) => void;
};

export default function PersonalRecommendationsList({
  category,
  minPrice,
  maxPrice,
  onPriceRangeLoad,
}: PersonalRecommendationsListProps) {
  return (
    <PersonalRecommendationsListContent
      key={`${category ?? "all"}:${minPrice ?? "initial"}:${maxPrice ?? "initial"}`}
      category={category}
      minPrice={minPrice}
      maxPrice={maxPrice}
      onPriceRangeLoad={onPriceRangeLoad}
    />
  );
}

function PersonalRecommendationsListContent({
  category,
  minPrice,
  maxPrice,
  onPriceRangeLoad,
}: PersonalRecommendationsListProps) {
  const router = useRouter();
  const [products, setProducts] = useState<PersonalRecommendation[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const hasNextRef = useRef(true);
  const nextCursorRef = useRef<string | null>(null);
  const requestGenerationRef = useRef(0);

  const loadNextPage = useCallback(async () => {
    if (isLoadingRef.current || !hasNextRef.current) {
      return;
    }

    const requestGeneration = requestGenerationRef.current;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const priceParams =
        minPrice !== undefined && maxPrice !== undefined ? { minPrice, maxPrice } : {};
      const data = await getPersonalRecommendations({
        ...priceParams,
        category,
        cursor: nextCursorRef.current ?? undefined,
        size: PAGE_SIZE,
      });

      if (!isMountedRef.current || requestGeneration !== requestGenerationRef.current) {
        return;
      }

      if (nextCursorRef.current === null) {
        onPriceRangeLoad?.(data.priceRange);
      }

      setProducts((currentProducts) => [...currentProducts, ...data.items]);
      nextCursorRef.current = data.nextCursor;
      hasNextRef.current = data.hasNext && Boolean(data.nextCursor);
      setNextCursor(data.nextCursor);
      setHasNext(hasNextRef.current);
    } catch (error) {
      // TODO: 429 응답의 Retry-After 또는 retryAfterSeconds를 활용한 재시도 안내 연동
      if (isMountedRef.current && requestGeneration === requestGenerationRef.current) {
        router.replace(
          error instanceof ApiRequestError && error.status === 401 ? "/login" : "/error",
        );
      }
    } finally {
      if (requestGeneration === requestGenerationRef.current) {
        isLoadingRef.current = false;

        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
  }, [category, maxPrice, minPrice, onPriceRangeLoad, router]);

  useEffect(() => {
    isMountedRef.current = true;
    requestGenerationRef.current += 1;
    isLoadingRef.current = false;
    void loadNextPage();

    return () => {
      isMountedRef.current = false;
      requestGenerationRef.current += 1;
    };
  }, [loadNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNext) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, loadNextPage, nextCursor]);

  if (!isLoading && products.length === 0 && !hasNext) {
    return <EmptyRecommendedProducts />;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-x-2 gap-y-5">
        {products.map((product) => (
          <ProductCard
            key={product.recommendationId}
            product={product}
            detailHref={`/products/${product.productId}?context=PERSONAL`}
          />
        ))}
      </div>

      {hasNext && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {isLoading && (
        <p role="status" className="py-4 text-center text-body-sm text-muted">
          추천 상품을 불러오는 중이에요.
        </p>
      )}
    </>
  );
}
