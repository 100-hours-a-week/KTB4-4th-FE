// 서버 선조회와 클라이언트 무한 쿼리가 함께 쓰는 내 추천 상품 쿼리 설정
import type { PersonalRecommendationsPage } from "@/lib/api/personalRecommendations";

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
  return ["personal-recommendations", { category, minPrice, maxPrice }] as const;
}

// 다음 커서가 없으면 null을 반환해 더 불러올 페이지가 없음을 알림
export function getPersonalRecommendationsNextPageParam(lastPage: PersonalRecommendationsPage) {
  return lastPage.hasNext ? lastPage.nextCursor : null;
}
