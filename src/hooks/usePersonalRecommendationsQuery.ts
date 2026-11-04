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

// 추천 결과는 취향 분석 확정 시에만 바뀌고 그때 캐시를 지우므로, 그 외에는 다시 요청하지 않도록 길게 신선하게 봄
// 다른 기기·탭에서 확정한 경우에 대비해 캐시 보관 기본값(5분)과 같은 시간이 지나면 다시 요청함
const PERSONAL_RECOMMENDATIONS_STALE_TIME_MS = 5 * 60 * 1000;

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
    staleTime: PERSONAL_RECOMMENDATIONS_STALE_TIME_MS,
    // 조건이 바뀌어 새 응답을 기다리는 동안 이전 조건의 목록을 계속 표시함
    placeholderData: keepPreviousData,
  });
}
