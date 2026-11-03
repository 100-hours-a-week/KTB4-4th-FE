// 내 추천 상품을 조건별로 캐시하고 커서 기반으로 이어 불러오는 무한 쿼리 훅
"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { getPersonalRecommendations } from "@/lib/api/personalRecommendations";
import {
  getPersonalRecommendationsNextPageParam,
  getPersonalRecommendationsQueryKey,
  PERSONAL_RECOMMENDATIONS_INITIAL_PAGE_PARAM,
  PERSONAL_RECOMMENDATIONS_PAGE_SIZE,
  type PersonalRecommendationsQueryParams,
} from "@/lib/personalRecommendationsQuery";

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
        size: PERSONAL_RECOMMENDATIONS_PAGE_SIZE,
      });
    },
    initialPageParam: PERSONAL_RECOMMENDATIONS_INITIAL_PAGE_PARAM,
    getNextPageParam: getPersonalRecommendationsNextPageParam,
    // 조건이 바뀌어 새 응답을 기다리는 동안 이전 조건의 목록을 계속 표시함
    placeholderData: keepPreviousData,
  });
}
