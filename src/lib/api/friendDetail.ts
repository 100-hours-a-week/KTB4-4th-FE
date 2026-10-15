// 친구 상세 조회를 위한 서버 API 요청과 응답 타입
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mapFriendDetail, type FriendDetailResponse } from "@/lib/api/friendDetailModel";
import { serverApiRequest } from "@/lib/api/serverClient";

export async function getServerFriendDetail(userId: number) {
  const { data } = await serverApiRequest<FriendDetailResponse>(
    API_ENDPOINTS.friends.detail(userId),
    {
      method: "GET",
      fallbackErrorMessage: "친구 상세 정보를 불러오지 못했습니다.",
    },
  );

  return mapFriendDetail(data);
}
