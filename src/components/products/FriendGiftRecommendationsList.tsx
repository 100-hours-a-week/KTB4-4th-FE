// 친구 선물 추천 상품을 가격 조건과 커서 기반 무한 스크롤로 표시하는 목록
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import EmptyRecommendedProducts from "@/components/products/EmptyRecommendedProducts";
import ProductCard from "@/components/products/ProductCard";
import { ApiRequestError } from "@/lib/api/client";
import { getGiftRecommendations, type GiftRecommendation } from "@/lib/api/giftRecommendations";

const PAGE_SIZE = 20;

type FriendGiftRecommendationsListProps = {
  userId: number;
  minPrice: number;
  maxPrice: number;
};

export default function FriendGiftRecommendationsList({
  userId,
  minPrice,
  maxPrice,
}: FriendGiftRecommendationsListProps) {
  return (
    <FriendGiftRecommendationsListContent
      key={`${userId}:${minPrice}:${maxPrice}`}
      userId={userId}
      minPrice={minPrice}
      maxPrice={maxPrice}
    />
  );
}

function FriendGiftRecommendationsListContent({
  userId,
  minPrice,
  maxPrice,
}: FriendGiftRecommendationsListProps) {
  const router = useRouter();
  const [products, setProducts] = useState<GiftRecommendation[]>([]);
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
      const data = await getGiftRecommendations({
        userId,
        minPrice,
        maxPrice,
        cursor: nextCursorRef.current ?? undefined,
        size: PAGE_SIZE,
      });

      if (!isMountedRef.current || requestGeneration !== requestGenerationRef.current) {
        return;
      }

      setProducts((currentProducts) => [...currentProducts, ...data.items]);
      nextCursorRef.current = data.nextCursor;
      hasNextRef.current = data.hasNext && Boolean(data.nextCursor);
      setNextCursor(data.nextCursor);
      setHasNext(hasNextRef.current);
    } catch (error) {
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
  }, [maxPrice, minPrice, router, userId]);

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
      {products.map((product) => (
        <ProductCard
          key={product.recommendationId}
          product={{
            name: product.name,
            price: product.price,
            imageUrl: product.productImageUrl,
            reason: product.reason,
          }}
        />
      ))}

      {hasNext && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {isLoading && (
        <p role="status" className="py-4 text-center text-body-sm text-muted">
          추천 상품을 불러오는 중이에요.
        </p>
      )}
    </>
  );
}
