// 마이페이지 진입 정보 조회를 위한 서버 API 요청과 응답 변환
import "server-only";

import { cookies } from "next/headers";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
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

interface MyPageErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

export class MyPageApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "MyPageApiError";
  }
}

function getBackendApiBaseUrl() {
  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL?.trim();

  if (!backendApiBaseUrl) {
    throw new Error("BACKEND_API_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  const normalizedBaseUrl = new URL(
    backendApiBaseUrl.endsWith("/") ? backendApiBaseUrl : `${backendApiBaseUrl}/`,
  );

  if (!new Set(["http:", "https:"]).has(normalizedBaseUrl.protocol)) {
    throw new Error("BACKEND_API_BASE_URL은 HTTP 또는 HTTPS 주소여야 합니다.");
  }

  return normalizedBaseUrl;
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
  const cookieHeader = (await cookies()).toString();
  const headers = new Headers({
    accept: "application/json",
  });

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(new URL(API_ENDPOINTS.users.me, getBackendApiBaseUrl()), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorResponse = (await response.json().catch(() => null)) as MyPageErrorResponse | null;

    throw new MyPageApiError(
      errorResponse?.message ?? "마이페이지 정보를 불러오지 못했습니다.",
      response.status,
      errorResponse?.data?.retryAfterSeconds,
    );
  }

  const { data } = (await response.json()) as MyPageResponse;

  return toMyPageData(data);
}
