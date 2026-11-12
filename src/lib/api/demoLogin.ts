// 테스트 계정 로그인 API 요청과 오류 응답 처리
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface DemoLoginCredentials {
  loginId: string;
  password: string;
}

interface DemoLoginErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const FALLBACK_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "아이디 또는 비밀번호가 올바르지 않습니다.",
  403: "이용이 제한된 계정입니다.",
  404: "테스트 계정 로그인을 사용할 수 없습니다.",
  422: "입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
};

function getRetryAfterSeconds(response: Response, errorResponse: DemoLoginErrorResponse | null) {
  const bodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof bodySeconds === "number" && Number.isFinite(bodySeconds)) {
    return Math.max(0, Math.ceil(bodySeconds));
  }

  const retryAfterHeader = response.headers.get("retry-after");
  const headerSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(headerSeconds) ? Math.max(0, Math.ceil(headerSeconds)) : undefined;
}

export async function loginWithDemoAccount(credentials: DemoLoginCredentials) {
  const response = await apiFetch(
    API_ENDPOINTS.auth.demoLogin,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      cache: "no-store",
    },
    { refreshAccessTokenOnUnauthorized: false },
  );

  if (response.ok) return;

  const errorResponse = (await response.json().catch(() => null)) as DemoLoginErrorResponse | null;
  const message =
    response.status === 404
      ? (FALLBACK_ERROR_MESSAGES[404] as string)
      : errorResponse?.message ||
        FALLBACK_ERROR_MESSAGES[response.status] ||
        "로그인하지 못했습니다.";

  throw new ApiRequestError(
    message,
    response.status,
    getRetryAfterSeconds(response, errorResponse),
  );
}
