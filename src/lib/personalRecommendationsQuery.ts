// 서버 선조회와 클라이언트 무한 쿼리가 함께 쓰는 내 추천 상품 쿼리 설정과 캐시 삭제 함수
import type { PersonalRecommendationsPage } from "@/lib/api/personalRecommendations";

import type { QueryClient } from "@tanstack/react-query";

const PERSONAL_RECOMMENDATIONS_QUERY_KEY_ROOT = "personal-recommendations";

export const PERSONAL_RECOMMENDATIONS_PAGE_SIZE = 20;

export const PERSONAL_RECOMMENDATIONS_INITIAL_PAGE_PARAM = null as string | null;

export type PersonalRecommendationsQueryParams = {
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
  return [PERSONAL_RECOMMENDATIONS_QUERY_KEY_ROOT, { category, minPrice, maxPrice }] as const;
}

// 다음 커서가 없으면 null을 반환해 더 불러올 페이지가 없음을 알림
export function getPersonalRecommendationsNextPageParam(lastPage: PersonalRecommendationsPage) {
  return lastPage.hasNext ? lastPage.nextCursor : null;
}

// 취향 분석 확정으로 추천 결과가 새로 만들어졌을 때 이전 조건의 목록이 보이지 않도록 모든 조건의 캐시를 지움
export function clearPersonalRecommendationsCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: [PERSONAL_RECOMMENDATIONS_QUERY_KEY_ROOT] });
}
