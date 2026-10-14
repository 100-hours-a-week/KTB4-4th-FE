// 로그인 유효성 확인 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { isLoginSessionResponse, type LoginSessionData } from "@/lib/api/loginSession";

export type LoginValidityData = LoginSessionData;

let loginValidityRequest: Promise<LoginValidityData> | null = null;

async function requestLoginValidity() {
  const response = await apiFetch(API_ENDPOINTS.auth.loginValidity, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("로그인 유효성을 확인하지 못했습니다.", response.status);
  }

  const responseBody = (await response.json().catch(() => null)) as unknown;

  if (!isLoginSessionResponse(responseBody)) {
    throw new ApiRequestError("로그인 세션 응답 형식이 올바르지 않습니다.", 502);
  }

  return responseBody.data;
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

export function clearLoginValidityCache() {
  loginValidityRequest = null;
}
