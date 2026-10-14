// 친구 목록 첫 페이지를 서버에서 미리 조회하는 서버 API 요청
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { FriendsPage, FriendsResponse } from "@/lib/api/friends";
import { ServerApiError, serverApiRequest } from "@/lib/api/serverClient";
import { USE_MOCK_DATA } from "@/mocks/config";

// FriendsList의 PAGE_SIZE와 같은 첫 페이지 크기
const INITIAL_PAGE_SIZE = 20;

// 조회 실패 시 null을 반환해 클라이언트에서 다시 조회하도록 함
export async function getInitialFriendsPage(): Promise<FriendsPage | null> {
  try {
    if (USE_MOCK_DATA) {
      const { getMockFriendsPage } = await import("@/mocks/friends");

      return await getMockFriendsPage({ size: INITIAL_PAGE_SIZE });
    }

    const searchParams = new URLSearchParams({ size: String(INITIAL_PAGE_SIZE) });
    const { data, totalCount, favoriteTotalCount, nextCursor, hasNext } =
      await serverApiRequest<FriendsResponse>(
        `${API_ENDPOINTS.friends.list}?${searchParams.toString()}`,
        {
          method: "GET",
          fallbackErrorMessage: "친구 목록을 불러오지 못했습니다.",
        },
      );

    return {
      items: data.items,
      isKakaoFriendSynced: data.isKakaoFriendSynced,
      totalCount,
      favoriteTotalCount,
      nextCursor,
      hasNext,
    };
  } catch (error) {
    console.warn("[friends] 친구 목록 서버 사전 조회 실패", {
      status: error instanceof ServerApiError ? error.status : undefined,
      message: error instanceof Error ? error.message : String(error),
    });

    return null;
  }
}
