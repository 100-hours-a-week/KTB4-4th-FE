// 마이페이지 진입 정보 조회를 위한 서버 API 요청과 응답 변환
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { serverApiRequest } from "@/lib/api/serverClient";
import type { MyPageData } from "@/types/mypage";

export interface MyPageLinkedAccount {
  provider: string;
  status: string;
}

export interface MyPageUser {
  id: number;
  name: string;
  profileImageUrl: string | null;
  birthDate: string;
  linkedAccount: MyPageLinkedAccount | null;
}

export interface MyPageAiSummary {
  status: string;
  content: string | null;
}

export interface MyPageTasteProfile {
  analysisStatus: string;
  preferenceKeywords: string[] | null;
  interestKeywords: string[] | null;
  aiSummary: MyPageAiSummary | null;
}

interface MyPageResponse {
  message: string;
  data: {
    user: MyPageUser;
    tasteProfile: MyPageTasteProfile | null;
  };
}

function toMyPageData({ user, tasteProfile }: MyPageResponse["data"]): MyPageData {
  return {
    profile: {
      userId: user.id,
      nickname: user.name,
      // TODO: 온보딩 생년월일 입력 연동 후 마이페이지 표시 형식 적용
      birthday: user.birthDate,
      profileImageUrl: user.profileImageUrl,
    },
    tasteKeywords: tasteProfile?.preferenceKeywords ?? [],
    interestKeywords: tasteProfile?.interestKeywords ?? [],
    aiSummary: tasteProfile?.aiSummary?.content ?? "",
  };
}

export async function getMyPage() {
  const { data } = await serverApiRequest<MyPageResponse>(API_ENDPOINTS.users.me, {
    method: "GET",
    fallbackErrorMessage: "마이페이지 정보를 불러오지 못했습니다.",
  });

  return toMyPageData(data);
}
