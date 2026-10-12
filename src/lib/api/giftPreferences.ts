// 저장된 온보딩 취향 데이터 조회를 위한 서버 API 요청과 응답 타입
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { serverApiRequest } from "@/lib/api/serverClient";
import type { AllergyCode, GiftExclusionCode, InterestCategoryCode } from "@/lib/onboardingOptions";

export interface GiftPreferencesData {
  exists: boolean;
  interestCategoryCodes: InterestCategoryCode[];
  allergyCodes: AllergyCode[];
  giftExclusionCodes: GiftExclusionCode[];
}

interface GiftPreferencesResponse {
  message: string;
  data: GiftPreferencesData;
}

export async function getGiftPreferences() {
  const { data } = await serverApiRequest<GiftPreferencesResponse>(
    API_ENDPOINTS.users.giftPreferences,
    {
      method: "GET",
      fallbackErrorMessage: "저장된 취향 데이터를 불러오지 못했습니다.",
    },
  );

  return data;
}
