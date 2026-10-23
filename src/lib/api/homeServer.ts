// 메인 페이지의 안내 문구와 내 추천 상품을 서버에서 조회하는 서버 API 요청
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { GuidanceResponse } from "@/lib/api/guidance";
import type {
  PersonalRecommendation,
  PersonalRecommendationsResponse,
} from "@/lib/api/personalRecommendations";
import { serverApiRequest } from "@/lib/api/serverClient";
import { USE_MOCK_DATA } from "@/mocks/config";

// 메인 페이지에 표시하는 내 추천 상품 수
const HOME_RECOMMENDATION_SIZE = 3;

export async function getHomeGuidance() {
  const { data } = await serverApiRequest<GuidanceResponse>(API_ENDPOINTS.guidance, {
    method: "GET",
    fallbackErrorMessage: "메인 안내 정보를 불러오지 못했습니다.",
  });

  return data;
}

export async function getHomeRecommendations(): Promise<PersonalRecommendation[]> {
  if (USE_MOCK_DATA) {
    const { getMockPersonalRecommendationsPage } = await import("@/mocks/recommendations");
    const { items } = await getMockPersonalRecommendationsPage({ size: HOME_RECOMMENDATION_SIZE });

    return items;
  }

  const searchParams = new URLSearchParams({ size: String(HOME_RECOMMENDATION_SIZE) });
  const { data } = await serverApiRequest<PersonalRecommendationsResponse>(
    `${API_ENDPOINTS.personalRecommendations}?${searchParams.toString()}`,
    {
      method: "GET",
      fallbackErrorMessage: "내 추천 상품을 불러오지 못했습니다.",
    },
  );

  return data.items;
}
