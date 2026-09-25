// 친구 선물 추천 상품 목록 조회 API 요청과 커서 페이지네이션 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface GiftRecommendation {
  recommendationId: number;
  productId: number;
  productImageUrl: string | null;
  category: string;
  name: string;
  price: number;
  matchingKeywords: string[];
  reason: string;
}

interface GiftRecommendationsData {
  items: GiftRecommendation[];
}

export interface GiftRecommendationsPage extends GiftRecommendationsData {
  nextCursor: string | null;
  hasNext: boolean;
}

interface GiftRecommendationsResponse {
  message: string;
  data: GiftRecommendationsData;
  nextCursor: string | null;
  hasNext: boolean;
}

interface GetGiftRecommendationsParams {
  userId: number;
  minPrice: number;
  maxPrice: number;
  cursor?: string;
  size?: number;
}

export async function getGiftRecommendations({
  userId,
  minPrice,
  maxPrice,
  cursor,
  size = 20,
}: GetGiftRecommendationsParams) {
  const searchParams = new URLSearchParams({
    minPrice: String(minPrice),
    maxPrice: String(maxPrice),
    size: String(size),
  });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await apiFetch(
    `${API_ENDPOINTS.giftRecommendations(userId)}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApiRequestError("친구 선물 추천 상품을 불러오지 못했습니다.", response.status);
  }

  const { data, nextCursor, hasNext } = (await response.json()) as GiftRecommendationsResponse;

  return {
    items: data.items,
    nextCursor,
    hasNext,
  } satisfies GiftRecommendationsPage;
}
