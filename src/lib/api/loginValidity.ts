// 로그인 유효성 확인 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface LoginUser {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

export interface LoginValidityData {
  user: LoginUser;
  birthday?: string;
  // TODO: 추후 API 버전에서 onboardingRequired와 currentStep이 추가되면 응답 타입과 온보딩 분기 처리를 반영합니다.
}

interface LoginValidityResponse {
  message: string;
  data: LoginValidityData;
}

let loginValidityRequest: Promise<LoginValidityData> | null = null;

async function requestLoginValidity() {
  const response = await apiFetch(API_ENDPOINTS.auth.loginValidity, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("로그인 유효성을 확인하지 못했습니다.", response.status);
  }

  const { data } = (await response.json()) as LoginValidityResponse;
  return data;
}

export function checkLoginValidity() {
  if (!loginValidityRequest) {
    loginValidityRequest = requestLoginValidity().catch((error) => {
      loginValidityRequest = null;
      throw error;
    });
  }

  return loginValidityRequest;
}
