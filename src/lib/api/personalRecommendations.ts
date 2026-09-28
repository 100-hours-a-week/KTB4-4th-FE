// 내 추천 상품 목록 조회 API 요청과 커서 페이지네이션 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface PersonalRecommendation {
  recommendationId: number;
  productId: number;
  name: string;
  productImageUrl: string | null;
  purchaseUrl: string;
  category: string;
  price: number;
  reason: string;
}

export interface PersonalRecommendationsPriceRange {
  minPrice: number;
  maxPrice: number;
}

export interface PersonalRecommendationsData {
  items: PersonalRecommendation[];
  priceRange: PersonalRecommendationsPriceRange | null;
}

export interface PersonalRecommendationsPage extends PersonalRecommendationsData {
  nextCursor: string | null;
  hasNext: boolean;
}

interface PersonalRecommendationsResponse {
  message: string;
  data: PersonalRecommendationsData;
  nextCursor: string | null;
  hasNext: boolean;
}

type PersonalRecommendationsPaginationParams = {
  cursor?: string;
  size?: number;
};

type PersonalRecommendationsPriceParams =
  | {
      minPrice: number;
      maxPrice: number;
    }
  | {
      minPrice?: undefined;
      maxPrice?: undefined;
    };

type GetPersonalRecommendationsParams = PersonalRecommendationsPaginationParams &
  PersonalRecommendationsPriceParams;

export async function getPersonalRecommendations({
  minPrice,
  maxPrice,
  cursor,
  size = 20,
}: GetPersonalRecommendationsParams = {}) {
  const searchParams = new URLSearchParams({ size: String(size) });

  if (minPrice !== undefined && maxPrice !== undefined) {
    searchParams.set("minPrice", String(minPrice));
    searchParams.set("maxPrice", String(maxPrice));
  }

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await apiFetch(
    `${API_ENDPOINTS.personalRecommendations}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApiRequestError("내 추천 상품을 불러오지 못했습니다.", response.status);
  }

  const { data, nextCursor, hasNext } = (await response.json()) as PersonalRecommendationsResponse;

  return {
    items: data.items,
    priceRange: data.priceRange,
    nextCursor,
    hasNext,
  } satisfies PersonalRecommendationsPage;
}
