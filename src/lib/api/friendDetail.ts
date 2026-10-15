// 친구 상세 조회를 위한 서버 API 요청과 응답 타입
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { FriendDetail } from "@/lib/api/friends";
import { serverApiRequest } from "@/lib/api/serverClient";

interface FriendDetailData {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  tasteAnalysisCompleted: boolean;
  birthDate: string | null;
  tasteKeywords: string[];
  interestKeywords: string[];
  interestSummary: string;
  isFavorite: boolean;
}

interface FriendDetailResponse {
  message: string;
  data: FriendDetailData;
}

export async function getServerFriendDetail(userId: number) {
  const { data } = await serverApiRequest<FriendDetailResponse>(
    API_ENDPOINTS.friends.detail(userId),
    {
      method: "GET",
      fallbackErrorMessage: "친구 상세 정보를 불러오지 못했습니다.",
    },
  );

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
