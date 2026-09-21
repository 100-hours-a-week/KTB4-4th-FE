// 상태 변경 API 요청에 사용할 CSRF 토큰 발급 및 캐시 유틸
"use client";

import { API_ENDPOINTS } from "@/lib/api/endpoints";

export const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

interface CsrfTokenResponse {
  message: string;
  data: {
    token: string;
  };
}

let cachedToken: string | null = null;
let tokenRequest: Promise<string> | null = null;

async function requestCsrfToken() {
  const response = await fetch(API_ENDPOINTS.auth.csrf, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CSRF 토큰 발급에 실패했습니다. (${response.status})`);
  }

  const { data } = (await response.json()) as CsrfTokenResponse;

  if (!data?.token) {
    throw new Error("CSRF 토큰 응답이 올바르지 않습니다.");
  }

  cachedToken = data.token;
  return data.token;
}

export function clearCsrfToken() {
  cachedToken = null;
}

export async function getCsrfToken(forceRefresh = false) {
  if (forceRefresh) {
    clearCsrfToken();
  }

  if (cachedToken) {
    return cachedToken;
  }

  if (!tokenRequest) {
    tokenRequest = requestCsrfToken().finally(() => {
      tokenRequest = null;
    });
  }

  return tokenRequest;
}

export async function getCsrfHeaders(forceRefresh = false) {
  return {
    [CSRF_HEADER_NAME]: await getCsrfToken(forceRefresh),
  };
}
