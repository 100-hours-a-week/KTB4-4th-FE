// 친구 목록 조회 API 요청과 커서 페이지네이션 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface FriendListItem {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  // TODO: 백엔드 생일 데이터 완성 후 친구 목록 표시 정보로 활용
  birthDate: string;
  isFavorite: boolean;
}

export interface FriendDetail {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  tasteAnalysisCompleted: boolean;
  birthDate: string;
}

interface FriendsData {
  items: FriendListItem[];
  isKakaoFriendSynced: boolean;
}

export interface FriendsPage extends FriendsData {
  nextCursor: string | null;
  hasNext: boolean;
}

interface FriendsResponse {
  message: string;
  data: FriendsData;
  nextCursor: string | null;
  hasNext: boolean;
}

interface FriendDetailResponse {
  message: string;
  data: FriendDetail;
}

interface GetFriendsParams {
  cursor?: string;
  size?: number;
}

export async function getFriends({ cursor, size = 20 }: GetFriendsParams = {}) {
  const searchParams = new URLSearchParams({
    size: String(size),
  });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await apiFetch(`${API_ENDPOINTS.friends.list}?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("친구 목록을 불러오지 못했습니다.", response.status);
  }

  const { data, nextCursor, hasNext } = (await response.json()) as FriendsResponse;

  return {
    items: data.items,
    isKakaoFriendSynced: data.isKakaoFriendSynced,
    nextCursor,
    hasNext,
  } satisfies FriendsPage;
}

export async function getFriendDetail(userId: number) {
  const response = await apiFetch(API_ENDPOINTS.friends.detail(userId), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("친구 상세 정보를 불러오지 못했습니다.", response.status);
  }

  const { data } = (await response.json()) as FriendDetailResponse;

  return data;
}
