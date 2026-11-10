// 상품 추천 화면 첫 진입 시 내 추천 상품 첫 페이지를 서버에서 조회하는 서버 API 요청
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  PersonalRecommendationsPage,
  PersonalRecommendationsResponse,
} from "@/lib/api/personalRecommendations";
import { serverApiRequest } from "@/lib/api/serverClient";
import { PERSONAL_RECOMMENDATIONS_PAGE_SIZE } from "@/lib/personalRecommendationsQuery";
import { USE_MOCK_DATA } from "@/mocks/config";

// 카테고리·예산 조건이 없는 초기 목록의 첫 페이지만 조회함
export async function getServerPersonalRecommendationsFirstPage(): Promise<PersonalRecommendationsPage> {
  if (USE_MOCK_DATA) {
    const { getMockPersonalRecommendationsPage } = await import("@/mocks/recommendations");

    return getMockPersonalRecommendationsPage({ size: PERSONAL_RECOMMENDATIONS_PAGE_SIZE });
  }

  const searchParams = new URLSearchParams({ size: String(PERSONAL_RECOMMENDATIONS_PAGE_SIZE) });
  const { data, nextCursor, hasNext } = await serverApiRequest<PersonalRecommendationsResponse>(
    `${API_ENDPOINTS.personalRecommendations}?${searchParams.toString()}`,
    {
      method: "GET",
      fallbackErrorMessage: "내 추천 상품을 불러오지 못했습니다.",
    },
  );

  return {
    items: data.items,
    priceRange: data.priceRange,
    nextCursor,
    hasNext,
  };
}
