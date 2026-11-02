// 내 추천 상품을 조건별로 캐시하고 커서 기반으로 이어 불러오는 무한 쿼리 훅
"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { getPersonalRecommendations } from "@/lib/api/personalRecommendations";

const PAGE_SIZE = 20;

type PersonalRecommendationsQueryParams = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
};

// 카테고리·예산이 같으면 같은 캐시를 사용하도록 조건 값을 쿼리 키에 포함함
export function getPersonalRecommendationsQueryKey({
  category,
  minPrice,
  maxPrice,
}: PersonalRecommendationsQueryParams) {
  return ["personal-recommendations", { category, minPrice, maxPrice }] as const;
}

export function usePersonalRecommendationsQuery({
  category,
  minPrice,
  maxPrice,
}: PersonalRecommendationsQueryParams) {
  return useInfiniteQuery({
    queryKey: getPersonalRecommendationsQueryKey({ category, minPrice, maxPrice }),
    queryFn: ({ pageParam }) => {
      const priceParams =
        minPrice !== undefined && maxPrice !== undefined ? { minPrice, maxPrice } : {};

      return getPersonalRecommendations({
        ...priceParams,
        category,
        cursor: pageParam ?? undefined,
        size: PAGE_SIZE,
      });
    },
    initialPageParam: null as string | null,
    // 다음 커서가 없으면 null을 반환해 더 불러올 페이지가 없음을 알림
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : null),
    // 조건이 바뀌어 새 응답을 기다리는 동안 이전 조건의 목록을 계속 표시함
    placeholderData: keepPreviousData,
  });
}
