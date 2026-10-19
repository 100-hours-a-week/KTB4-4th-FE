// 웹 푸시 VAPID 공개키 조회와 현재 기기의 구독 등록·상태 조회·해제 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface VapidPublicKey {
  publicKey: string;
}

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

let vapidPublicKeyRequest: Promise<string> | null = null;

async function requestVapidPublicKey() {
  // 인증이 필요 없는 공개 API라 토큰 재발급 처리 없이 요청함
  const response = await fetch(API_ENDPOINTS.notifications.webPushPublicKey, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await createPushSubscriptionError(response, "VAPID 공개키를 사용할 수 없습니다.");
  }

  const { data } = (await response.json()) as PushSubscriptionApiResponse<VapidPublicKey>;
  return data.publicKey;
}

// 공개키는 실행 환경마다 고정이므로 페이지 안에서 한 번만 조회하고, 실패하면 다음 호출에서 다시 조회함
export function getVapidPublicKey() {
  if (!vapidPublicKeyRequest) {
    vapidPublicKeyRequest = requestVapidPublicKey().catch((error: unknown) => {
      vapidPublicKeyRequest = null;
      throw error;
    });
  }

  return vapidPublicKeyRequest;
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

// 서버는 현재 사용자의 해당 endpoint 구독만 삭제하며, 없거나 다른 사용자의 구독이어도 204로 응답함
export async function unregisterPushSubscription(endpoint: string) {
  const response = await apiFetch(API_ENDPOINTS.users.pushSubscriptions, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    throw await createPushSubscriptionError(response, "웹 푸시 알림을 끄지 못했습니다.");
  }
}
