// 친구 목록·상세 조회, 즐겨찾기 변경, 콕 찌르기 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { USE_MOCK_DATA } from "@/mocks/config";

export interface FriendListItem {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  birthDate: string | null;
  isFavorite: boolean;
}

export interface FriendDetail {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  tasteAnalysisCompleted: boolean;
  birthDate: string;
  tasteKeywords: string[];
  interestKeywords: string[];
  interestSummary: string;
  isFavorite: boolean;
}

export interface FriendFavorite {
  userId: number;
  isFavorite: boolean;
}

interface FriendsData {
  items: FriendListItem[];
  isKakaoFriendSynced: boolean;
}

export interface FriendsPage extends FriendsData {
  totalCount?: number;
  favoriteTotalCount?: number;
  nextCursor: string | null;
  hasNext: boolean;
}

export interface FriendsResponse {
  message: string;
  data: FriendsData;
  totalCount?: number;
  favoriteTotalCount?: number;
  nextCursor: string | null;
  hasNext: boolean;
}

interface FriendsErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

interface FriendDetailData {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  tasteAnalysisCompleted: boolean;
  birthDate: string;
  tasteKeywords: string[];
  interestKeywords: string[];
  interestSummary: string;
  isFavorite: boolean;
}

interface FriendDetailResponse {
  message: string;
  data: FriendDetailData;
}

export interface FriendPoke {
  friendUserId: number;
  createdAt: string;
  nextPokeAvailableAt: string;
}

interface FriendPokeResponse {
  message: string;
  data: FriendPoke;
}

interface FriendFavoriteResponse {
  message: string;
  data: FriendFavorite;
}

export interface GetFriendsParams {
  cursor?: string;
  size?: number;
  favorite?: boolean;
  keyword?: string;
  signal?: AbortSignal;
}

const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 50;
const MAX_KEYWORD_LENGTH = 20;
const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "친구 목록을 조회할 수 없는 계정입니다.",
  404: "사용자 정보를 찾을 수 없습니다.",
  422: "입력값이 유효하지 않습니다. 입력 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};
const FRIEND_FAVORITE_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "보안 토큰을 확인하지 못했습니다. 다시 시도해 주세요.",
  404: "친구를 찾을 수 없습니다.",
  422: "입력값이 유효하지 않습니다. 입력 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};
const FRIEND_DETAIL_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  404: "친구를 찾을 수 없습니다.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};
const FRIEND_POKE_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  404: "친구를 찾을 수 없습니다.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

function getRetryAfterSeconds(response: Response, errorResponse: FriendsErrorResponse | null) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(retryAfterSeconds) ? Math.max(0, Math.ceil(retryAfterSeconds)) : undefined;
}

function normalizeKeyword(keyword?: string) {
  const normalizedKeyword = keyword?.trim();

  if (!normalizedKeyword) {
    return undefined;
  }

  if (normalizedKeyword.length > MAX_KEYWORD_LENGTH) {
    throw new ApiRequestError(`검색어는 ${MAX_KEYWORD_LENGTH}자 이하로 입력해 주세요.`, 422);
  }

  return normalizedKeyword;
}

function validatePageSize(size: number) {
  if (!Number.isInteger(size) || size < MIN_PAGE_SIZE || size > MAX_PAGE_SIZE) {
    throw new ApiRequestError(
      `친구 목록은 ${MIN_PAGE_SIZE}개 이상 ${MAX_PAGE_SIZE}개 이하로 요청해 주세요.`,
      422,
    );
  }
}

export async function getFriends({
  cursor,
  size = 20,
  favorite,
  keyword,
  signal,
}: GetFriendsParams = {}) {
  validatePageSize(size);
  const normalizedKeyword = normalizeKeyword(keyword);

  if (USE_MOCK_DATA) {
    const { getMockFriendsPage } = await import("@/mocks/friends");

    return getMockFriendsPage({
      cursor,
      size,
      favorite,
      keyword: normalizedKeyword,
      signal,
    });
  }

  const searchParams = new URLSearchParams({
    size: String(size),
  });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  if (typeof favorite === "boolean") {
    searchParams.set("favorite", String(favorite));
  }

  if (normalizedKeyword) {
    searchParams.set("keyword", normalizedKeyword);
  }

  const response = await apiFetch(`${API_ENDPOINTS.friends.list}?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    const errorResponse = (await response.json().catch(() => null)) as FriendsErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        DEFAULT_ERROR_MESSAGES[response.status] ??
        "친구 목록을 불러오지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data, totalCount, favoriteTotalCount, nextCursor, hasNext } =
    (await response.json()) as FriendsResponse;

  return {
    items: data.items,
    isKakaoFriendSynced: data.isKakaoFriendSynced,
    totalCount,
    favoriteTotalCount,
    nextCursor,
    hasNext,
  } satisfies FriendsPage;
}

export async function getFriendDetail(userId: number) {
  if (USE_MOCK_DATA) {
    const { getMockFriendDetail, isMockFriendId } = await import("@/mocks/friends");

    if (isMockFriendId(userId)) {
      return getMockFriendDetail(userId);
    }
  }

  const response = await apiFetch(API_ENDPOINTS.friends.detail(userId), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorResponse = (await response.json().catch(() => null)) as FriendsErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        FRIEND_DETAIL_ERROR_MESSAGES[response.status] ??
        "친구 상세 정보를 불러오지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as FriendDetailResponse;

  return {
    id: data.userId,
    nickname: data.name,
    profileImageUrl: data.profileImageUrl,
    tasteAnalysisCompleted: data.tasteAnalysisCompleted,
    birthDate: data.birthDate,
    tasteKeywords: data.tasteKeywords,
    interestKeywords: data.interestKeywords,
    interestSummary: data.interestSummary,
    isFavorite: data.isFavorite,
  } satisfies FriendDetail;
}

export async function updateFriendFavorite(userId: number, isFavorite: boolean) {
  if (USE_MOCK_DATA) {
    const { updateMockFriendFavorite } = await import("@/mocks/friends");

    return updateMockFriendFavorite(userId, isFavorite);
  }

  const response = await apiFetch(API_ENDPOINTS.friends.favorite(userId), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isFavorite }),
  });

  if (!response.ok) {
    const errorResponse = (await response.json().catch(() => null)) as FriendsErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        FRIEND_FAVORITE_ERROR_MESSAGES[response.status] ??
        "즐겨찾기를 변경하지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as FriendFavoriteResponse;

  return data;
}

// 성공 시 201과 다음 콕 찌르기 가능 시각을 반환하며, 제한 시간 안의 재요청은 429와 남은 초를 반환함
export async function pokeFriend(userId: number) {
  const response = await apiFetch(API_ENDPOINTS.friends.pokes(userId), {
    method: "POST",
  });

  if (!response.ok) {
    const errorResponse = (await response.json().catch(() => null)) as FriendsErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        FRIEND_POKE_ERROR_MESSAGES[response.status] ??
        "친구를 콕 찌르지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as FriendPokeResponse;

  return data;
}
