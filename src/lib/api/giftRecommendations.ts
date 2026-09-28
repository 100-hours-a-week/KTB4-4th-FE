// 친구 선물 추천 상품 목록 조회 API 요청과 커서 페이지네이션 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface GiftRecommendation {
  recommendationId: number;
  productId: number;
  productImageUrl: string | null;
  purchaseUrl: string;
  category: string;
  name: string;
  price: number;
  matchingKeywords: string[];
  reason: string;
}

export interface GiftRecommendationsPriceRange {
  minPrice: number;
  maxPrice: number;
}

interface GiftRecommendationsData {
  items: GiftRecommendation[];
  priceRange: GiftRecommendationsPriceRange | null;
}

interface GiftRecommendationsPriceRangeResponse {
  minPrice: number | null;
  maxPrice: number | null;
}

export interface GiftRecommendationsPage extends GiftRecommendationsData {
  nextCursor: string | null;
  hasNext: boolean;
}

interface GiftRecommendationsResponse {
  message: string;
  data: {
    items: GiftRecommendation[];
    priceRange: GiftRecommendationsPriceRangeResponse | null;
  };
  nextCursor: string | null;
  hasNext: boolean;
}

type GiftRecommendationsPaginationParams = {
  userId: number;
  cursor?: string;
  size?: number;
};

type GiftRecommendationsPriceParams =
  | {
      minPrice: number;
      maxPrice: number;
    }
  | {
      minPrice?: undefined;
      maxPrice?: undefined;
    };

type GetGiftRecommendationsParams = GiftRecommendationsPaginationParams &
  GiftRecommendationsPriceParams;

const normalizePriceRange = (
  priceRange: GiftRecommendationsPriceRangeResponse | null,
): GiftRecommendationsPriceRange | null => {
  if (
    !priceRange ||
    typeof priceRange.minPrice !== "number" ||
    typeof priceRange.maxPrice !== "number" ||
    !Number.isFinite(priceRange.minPrice) ||
    !Number.isFinite(priceRange.maxPrice) ||
    priceRange.minPrice > priceRange.maxPrice
  ) {
    return null;
  }

  return {
    minPrice: priceRange.minPrice,
    maxPrice: priceRange.maxPrice,
  };
};

export async function getGiftRecommendations({
  userId,
  minPrice,
  maxPrice,
  cursor,
  size = 20,
}: GetGiftRecommendationsParams) {
  const searchParams = new URLSearchParams({ size: String(size) });

  if (minPrice !== undefined && maxPrice !== undefined) {
    searchParams.set("minPrice", String(minPrice));
    searchParams.set("maxPrice", String(maxPrice));
  }

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
    priceRange: normalizePriceRange(data.priceRange),
    nextCursor,
    hasNext,
  } satisfies GiftRecommendationsPage;
}
