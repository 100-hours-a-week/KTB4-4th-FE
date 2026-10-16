// 회원 탈퇴 API 요청 함수
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

const WITHDRAWAL_FAILED_MESSAGE = "회원 탈퇴를 처리하지 못했습니다.";

interface WithdrawalErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  409: "회원 탈퇴 처리가 이미 진행 중입니다.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

function getRetryAfterSeconds(response: Response, errorResponse: WithdrawalErrorResponse | null) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(retryAfterSeconds) ? Math.max(0, Math.ceil(retryAfterSeconds)) : undefined;
}

// 서버가 회원 soft delete, Refresh 세션·웹 푸시 구독 폐기, 카카오 연결 끊기 후 인증 쿠키를 삭제하며 200으로 응답함
// 503은 카카오 연결 끊기 실패로 탈퇴가 처리되지 않은 상태이므로 다시 시도할 수 있음
// CSRF 토큰 만료(403) 시 재발급 후 재시도와 401 시 토큰 재발급은 apiFetch에서 처리됨
export async function withdraw() {
  const response = await apiFetch(API_ENDPOINTS.users.me, {
    method: "DELETE",
    cache: "no-store",
  });

  if (response.ok) return;

  const errorResponse = (await response.json().catch(() => null)) as WithdrawalErrorResponse | null;

  throw new ApiRequestError(
    errorResponse?.message ?? DEFAULT_ERROR_MESSAGES[response.status] ?? WITHDRAWAL_FAILED_MESSAGE,
    response.status,
    getRetryAfterSeconds(response, errorResponse),
  );
}
