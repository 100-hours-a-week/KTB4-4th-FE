// 내 공개 상품과 친구 선물 추천 상품 목록 조회 API 요청 및 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { USE_MOCK_DATA } from "@/mocks/config";

export interface GiftRecommendation {
  recommendationId: number;
  productId: number;
  productImageUrl: string | null;
  purchaseUrl: string;
  category: string;
  name: string;
  price: number;
  score: number;
  matchingKeywords: string[];
  reason: string;
}

export type GiftRecommendationFeedback = "LIKE" | "DISLIKE";

export interface MyGiftRecommendation extends GiftRecommendation {
  myFeedback: GiftRecommendationFeedback | null;
}

export interface GiftRecommendationsPriceRange {
  minPrice: number;
  maxPrice: number;
}

interface GiftRecommendationsData<TItem extends GiftRecommendation> {
  items: TItem[];
  priceRange: GiftRecommendationsPriceRange | null;
}

interface GiftRecommendationsPriceRangeResponse {
  minPrice: number | null;
  maxPrice: number | null;
}

export interface GiftRecommendationsPage<
  TItem extends GiftRecommendation = GiftRecommendation,
> extends GiftRecommendationsData<TItem> {
  nextCursor: string | null;
  hasNext: boolean;
}

interface GiftRecommendationsResponse<TItem extends GiftRecommendation> {
  message: string;
  data: {
    items: TItem[];
    priceRange: GiftRecommendationsPriceRangeResponse | null;
  };
  nextCursor: string | null;
  hasNext: boolean;
}

type GiftRecommendationsPaginationParams = {
  category?: string;
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

type GetFriendGiftRecommendationsParams = GetGiftRecommendationsParams & {
  userId: number;
};

type GiftRecommendationsRequestParams = GiftRecommendationsPaginationParams & {
  minPrice?: number;
  maxPrice?: number;
};

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

async function requestGiftRecommendations<TItem extends GiftRecommendation>(
  endpoint: string,
  { category, minPrice, maxPrice, cursor, size = 20 }: GiftRecommendationsRequestParams,
) {
  const searchParams = new URLSearchParams({ size: String(size) });

  if (minPrice !== undefined && maxPrice !== undefined) {
    searchParams.set("minPrice", String(minPrice));
    searchParams.set("maxPrice", String(maxPrice));
  }

  if (category) {
    searchParams.set("category", category);
  }

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await apiFetch(`${endpoint}?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("선물 추천 상품을 불러오지 못했습니다.", response.status);
  }

  const { data, nextCursor, hasNext } =
    (await response.json()) as GiftRecommendationsResponse<TItem>;

  return {
    items: data.items,
    priceRange: normalizePriceRange(data.priceRange),
    nextCursor,
    hasNext,
  } satisfies GiftRecommendationsPage<TItem>;
}

export async function getMyGiftRecommendations(params: GetGiftRecommendationsParams) {
  if (USE_MOCK_DATA) {
    const { getMockMyGiftRecommendationsPage } = await import("@/mocks/recommendations");

    return getMockMyGiftRecommendationsPage({
      ...params,
      size: params.size ?? 20,
    });
  }

  return requestGiftRecommendations<MyGiftRecommendation>(
    API_ENDPOINTS.users.giftRecommendations,
    params,
  );
}

export async function getGiftRecommendations({
  userId,
  category,
  minPrice,
  maxPrice,
  cursor,
  size = 20,
}: GetFriendGiftRecommendationsParams) {
  const params = {
    category,
    minPrice,
    maxPrice,
    cursor,
    size,
  };

  if (USE_MOCK_DATA) {
    const { getMockGiftRecommendationsPage } = await import("@/mocks/recommendations");

    return getMockGiftRecommendationsPage(params);
  }

  return requestGiftRecommendations<GiftRecommendation>(
    API_ENDPOINTS.giftRecommendations(userId),
    params,
  );
}
