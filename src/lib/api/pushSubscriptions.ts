// 현재 기기의 웹 푸시 구독 등록과 구독 상태 조회 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface RegisterPushSubscriptionResult {
  enabled: boolean;
  updatedAt: string;
}

export interface PushSubscriptionStatus {
  subscribed: boolean;
}

interface PushSubscriptionApiResponse<T> {
  message: string;
  data: T;
}

interface PushSubscriptionErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  422: "입력 값이 유효하지 않습니다. 입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: PushSubscriptionErrorResponse | null,
) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(retryAfterSeconds) ? Math.max(0, Math.ceil(retryAfterSeconds)) : undefined;
}

async function createPushSubscriptionError(response: Response, fallbackMessage: string) {
  const errorResponse = (await response
    .json()
    .catch(() => null)) as PushSubscriptionErrorResponse | null;

  return new ApiRequestError(
    errorResponse?.message ?? DEFAULT_ERROR_MESSAGES[response.status] ?? fallbackMessage,
    response.status,
    getRetryAfterSeconds(response, errorResponse),
  );
}

// 구독 정보는 인증 정보이므로 가공하거나 로그에 남기지 않고 toJSON() 결과를 그대로 전달함
export async function registerPushSubscription(subscription: PushSubscription) {
  const response = await apiFetch(API_ENDPOINTS.users.pushSubscriptions, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!response.ok) {
    throw await createPushSubscriptionError(response, "웹 푸시 알림을 켜지 못했습니다.");
  }

  const { data } =
    (await response.json()) as PushSubscriptionApiResponse<RegisterPushSubscriptionResult>;
  return data;
}

// endpoint가 쿼리스트링과 접근 로그에 남지 않도록 조회지만 POST 본문으로 전달함
export async function getPushSubscriptionStatus(endpoint: string) {
  const response = await apiFetch(API_ENDPOINTS.users.pushSubscriptionStatus, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    throw await createPushSubscriptionError(response, "웹 푸시 알림 상태를 확인하지 못했습니다.");
  }

  const { data } = (await response.json()) as PushSubscriptionApiResponse<PushSubscriptionStatus>;
  return data;
}
