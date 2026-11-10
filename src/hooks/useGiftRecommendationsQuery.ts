// 내 공개 상품 또는 친구 선물 추천 상품을 조건별로 캐시하고 커서 기반으로 이어 불러오는 무한 쿼리 훅
"use client";

import { keepPreviousData, type QueryClient, useInfiniteQuery } from "@tanstack/react-query";

import {
  getFriendGiftRecommendations,
  getMyGiftRecommendations,
  type GiftRecommendationsPage,
} from "@/lib/api/giftRecommendations";

const GIFT_RECOMMENDATIONS_QUERY_KEY_ROOT = "gift-recommendations";
const PAGE_SIZE = 20;
// 뒤로 가기 시 새 상품이 끼어들어 복원 위치가 어긋나지 않도록 내 추천 목록과 같은 시간 동안 다시 요청하지 않음
const GIFT_RECOMMENDATIONS_STALE_TIME_MS = 5 * 60 * 1000;

export type GiftRecommendationsTarget =
  | { type: "SELF" }
  | {
      type: "FRIEND";
      userId: number;
    };

type GiftRecommendationsQueryParams = {
  target: GiftRecommendationsTarget;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
};

// 대상(나·친구)과 카테고리·예산이 같으면 같은 캐시를 사용하도록 조건 값을 쿼리 키에 포함함
export function getGiftRecommendationsQueryKey({
  target,
  category,
  minPrice,
  maxPrice,
}: GiftRecommendationsQueryParams) {
  const targetUserId = target.type === "FRIEND" ? target.userId : undefined;

  return [
    GIFT_RECOMMENDATIONS_QUERY_KEY_ROOT,
    { targetType: target.type, targetUserId, category, minPrice, maxPrice },
  ] as const;
}

// 내 취향 분석 확정으로 추천 결과가 바뀌었을 때 내 공개 상품의 모든 조건 캐시를 지움
// 친구 추천은 친구의 분석 결과에 따라 달라지므로 지우지 않음
export function clearMyGiftRecommendationsCache(queryClient: QueryClient) {
  queryClient.removeQueries({
    queryKey: [GIFT_RECOMMENDATIONS_QUERY_KEY_ROOT, { targetType: "SELF" }],
  });
}

export function useGiftRecommendationsQuery({
  target,
  category,
  minPrice,
  maxPrice,
}: GiftRecommendationsQueryParams) {
  return useInfiniteQuery({
    queryKey: getGiftRecommendationsQueryKey({ target, category, minPrice, maxPrice }),
    queryFn: ({ pageParam }): Promise<GiftRecommendationsPage> => {
      const priceParams =
        minPrice !== undefined && maxPrice !== undefined ? { minPrice, maxPrice } : {};
      const paginationParams = {
        ...priceParams,
        category,
        cursor: pageParam ?? undefined,
        size: PAGE_SIZE,
      };

      return target.type === "FRIEND"
        ? getFriendGiftRecommendations({ userId: target.userId, ...paginationParams })
        : getMyGiftRecommendations(paginationParams);
    },
    initialPageParam: null as string | null,
    // 다음 커서가 없으면 null을 반환해 더 불러올 페이지가 없음을 알림
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : null),
    staleTime: GIFT_RECOMMENDATIONS_STALE_TIME_MS,
    // 조건이 바뀌어 새 응답을 기다리는 동안 이전 조건의 목록을 계속 표시함
    placeholderData: keepPreviousData,
  });
}
