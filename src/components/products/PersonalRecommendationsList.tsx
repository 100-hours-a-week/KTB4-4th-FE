// 내 추천 상품을 커서 기반 무한 스크롤로 표시하는 목록
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import EmptyRecommendedProducts from "@/components/products/EmptyRecommendedProducts";
import ProductCard from "@/components/products/ProductCard";
import {
  getPersonalRecommendations,
  type PersonalRecommendation,
} from "@/lib/api/personalRecommendations";

const PAGE_SIZE = 20;

export default function PersonalRecommendationsList() {
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

  const loadNextPage = useCallback(async () => {
    if (isLoadingRef.current || !hasNextRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const data = await getPersonalRecommendations({
        cursor: nextCursorRef.current ?? undefined,
        size: PAGE_SIZE,
      });

      if (!isMountedRef.current) {
        return;
      }

      setProducts((currentProducts) => [...currentProducts, ...data.items]);
      nextCursorRef.current = data.nextCursor;
      hasNextRef.current = data.hasNext && Boolean(data.nextCursor);
      setNextCursor(data.nextCursor);
      setHasNext(hasNextRef.current);
    } catch {
      if (isMountedRef.current) {
        router.replace("/error");
      }
    } finally {
      isLoadingRef.current = false;

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadNextPage();

    return () => {
      isMountedRef.current = false;
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
        <ProductCard key={product.recommendationId} product={product} />
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
