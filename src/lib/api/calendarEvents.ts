// 캘린더 일정 등록 API 요청과 응답 처리
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { CalendarEventColor } from "@/types/calendar";

export interface CreateCalendarEventRequest {
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  description?: string;
  color: CalendarEventColor;
  notificationEnabled: boolean;
}

export interface CreatedCalendarEvent {
  eventId: number;
}

interface CreateCalendarEventResponse {
  message: string;
  data: CreatedCalendarEvent;
}

interface CalendarEventErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "요청을 처리할 권한이 없습니다.",
  422: "입력 값이 유효하지 않습니다. 입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: CalendarEventErrorResponse | null,
) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(retryAfterSeconds) ? Math.max(0, Math.ceil(retryAfterSeconds)) : undefined;
}

export async function createCalendarEvent(payload: CreateCalendarEventRequest) {
  const response = await apiFetch(API_ENDPOINTS.calendar.events, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as CalendarEventErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        DEFAULT_ERROR_MESSAGES[response.status] ??
        "캘린더 일정을 등록하지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as CreateCalendarEventResponse;

  return data;
}
