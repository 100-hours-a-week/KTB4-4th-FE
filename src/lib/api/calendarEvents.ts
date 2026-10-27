// 캘린더 일정 등록·월별 요약·날짜별 목록·상세 API 요청과 응답 처리
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

export interface CalendarSummaryIndicator {
  eventId: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  color: CalendarEventColor;
}

export interface CalendarSummaryItem {
  date: string;
  eventCount: number;
  indicators: CalendarSummaryIndicator[];
}

export interface CalendarSummaryResult {
  items: CalendarSummaryItem[];
}

export interface CalendarDailyEvent {
  eventId: number;
  title: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  color: CalendarEventColor | null;
}

export interface CalendarDailyEventListResult {
  items: CalendarDailyEvent[];
}

export interface CalendarEventDetailResult {
  eventId: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  isNotificationEnabled: boolean;
  color: CalendarEventColor | null;
}

interface CreateCalendarEventResponse {
  message: string;
  data: CreatedCalendarEvent;
}

interface CalendarSummaryResponse {
  message: string;
  data: CalendarSummaryResult;
}

interface CalendarDailyEventListResponse {
  message: string;
  data: CalendarDailyEventListResult;
}

interface CalendarEventDetailResponse {
  message: string;
  data: CalendarEventDetailResult;
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
  404: "캘린더 일정을 찾을 수 없습니다.",
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

async function toCalendarEventError(response: Response, fallbackMessage: string) {
  const errorResponse = (await response
    .json()
    .catch(() => null)) as CalendarEventErrorResponse | null;

  return new ApiRequestError(
    errorResponse?.message ?? DEFAULT_ERROR_MESSAGES[response.status] ?? fallbackMessage,
    response.status,
    getRetryAfterSeconds(response, errorResponse),
  );
}

export async function getCalendarSummary(targetMonth: string) {
  const searchParams = new URLSearchParams({ targetMonth });
  const response = await apiFetch(`${API_ENDPOINTS.calendar.events}?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toCalendarEventError(response, "캘린더 일정 요약을 불러오지 못했습니다.");
  }

  const { data } = (await response.json()) as CalendarSummaryResponse;

  return data;
}

export async function getCalendarDailyEvents(date: string) {
  const searchParams = new URLSearchParams({ date });
  const response = await apiFetch(
    `${API_ENDPOINTS.calendar.dailyEvents}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await toCalendarEventError(response, "캘린더 일정 목록을 불러오지 못했습니다.");
  }

  const { data } = (await response.json()) as CalendarDailyEventListResponse;

  return data;
}

export async function getCalendarEventDetail(eventId: number) {
  const response = await apiFetch(API_ENDPOINTS.calendar.event(eventId), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toCalendarEventError(response, "캘린더 일정을 불러오지 못했습니다.");
  }

  const { data } = (await response.json()) as CalendarEventDetailResponse;

  return data;
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
    throw await toCalendarEventError(response, "캘린더 일정을 등록하지 못했습니다.");
  }

  const { data } = (await response.json()) as CreateCalendarEventResponse;

  return data;
}
