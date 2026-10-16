// 로그아웃 API 요청 함수
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

const LOGOUT_FAILED_MESSAGE = "로그아웃하지 못했습니다.";

interface LogoutErrorResponse {
  message?: string;
}

// 서버가 Refresh 세션을 폐기하고 Access·Refresh 쿠키를 삭제하며 204로 응답함
// CSRF 토큰 만료(403) 시 재발급 후 재시도는 apiFetch에서 처리됨
export async function logout() {
  const response = await apiFetch(API_ENDPOINTS.auth.logout, {
    method: "POST",
    cache: "no-store",
  });

  if (response.ok) return;

  const errorResponse = (await response.json().catch(() => null)) as LogoutErrorResponse | null;

  throw new ApiRequestError(errorResponse?.message || LOGOUT_FAILED_MESSAGE, response.status);
}
