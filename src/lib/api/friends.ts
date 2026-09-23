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

interface FriendsData {
  items: FriendListItem[];
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

interface GetFriendsParams {
  cursor?: string;
  size?: number;
}

export async function getFriends({ cursor, size = 20 }: GetFriendsParams = {}) {
  const searchParams = new URLSearchParams({
    sort: "name",
    size: String(size),
  });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await apiFetch(`${API_ENDPOINTS.friends}?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("친구 목록을 불러오지 못했습니다.", response.status);
  }

  const { data, nextCursor, hasNext } = (await response.json()) as FriendsResponse;

  return {
    items: data.items,
    nextCursor,
    hasNext,
  } satisfies FriendsPage;
}
