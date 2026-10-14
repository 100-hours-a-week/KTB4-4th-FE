// 알림 목록 조회, 미읽음 알림 상태 조회, 알림 읽음 처리 API 요청 및 응답 처리
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  NotificationListData,
  NotificationListPage,
  NotificationListParams,
  NotificationReadResult,
  NotificationSummary,
} from "@/types/notification";

interface NotificationListResponse {
  message: string;
  data: NotificationListData;
  nextCursor: string | null;
  hasNext: boolean;
}

interface NotificationSummaryResponse {
  message: string;
  data: NotificationSummary;
}

interface NotificationReadResponse {
  message: string;
  data: NotificationReadResult;
}

interface NotificationErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  404: "알림을 찾을 수 없습니다.",
  422: "입력값이 유효하지 않습니다. 입력 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

function getRetryAfterSeconds(response: Response, errorResponse: NotificationErrorResponse | null) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number") {
    return responseBodySeconds;
  }

  const retryAfterHeader = response.headers.get("Retry-After");

  if (!retryAfterHeader) return undefined;

  const seconds = Number(retryAfterHeader);

  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds));
  }

  const retryAt = Date.parse(retryAfterHeader);

  if (Number.isNaN(retryAt)) return undefined;

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

async function toApiRequestError(response: Response, fallbackMessage: string) {
  const errorResponse = (await response
    .json()
    .catch(() => null)) as NotificationErrorResponse | null;
  const message =
    errorResponse?.message ?? DEFAULT_ERROR_MESSAGES[response.status] ?? fallbackMessage;

  return new ApiRequestError(
    message,
    response.status,
    getRetryAfterSeconds(response, errorResponse),
  );
}

export async function getNotifications({
  category,
  cursor,
  size = 20,
  since,
}: NotificationListParams = {}) {
  const searchParams = new URLSearchParams({ size: String(size) });

  if (category) {
    searchParams.set("category", category);
  }

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  if (since) {
    searchParams.set("since", since);
  }

  const response = await apiFetch(
    `${API_ENDPOINTS.notifications.list}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await toApiRequestError(response, "알림 목록을 불러오지 못했습니다.");
  }

  const { data, nextCursor, hasNext } = (await response.json()) as NotificationListResponse;

  return {
    ...data,
    nextCursor,
    hasNext,
  } satisfies NotificationListPage;
}

export async function getNotificationSummary() {
  const response = await apiFetch(API_ENDPOINTS.notifications.summary, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiRequestError(response, "미읽음 알림 상태를 불러오지 못했습니다.");
  }

  const { data } = (await response.json()) as NotificationSummaryResponse;

  return data;
}

// 본문 없이 호출하며, 이미 읽은 알림도 200과 처음 readAt을 반환함
export async function markNotificationAsRead(notificationId: number) {
  const response = await apiFetch(API_ENDPOINTS.notifications.detail(notificationId), {
    method: "PATCH",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiRequestError(response, "알림을 읽음 처리하지 못했습니다.");
  }

  const { data } = (await response.json()) as NotificationReadResponse;

  return data;
}
