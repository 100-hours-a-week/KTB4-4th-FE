// 익명 채팅방 단위 사용자 신고 요청 타입과 요청 함수
"use client";

import { ApiRequestError, apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type AnonymousChatReportReason = "ABUSE" | "SEXUAL" | "SPAM" | "PERSONAL_INFO" | "OTHER";

export interface AnonymousChatReportRequest {
  reason: AnonymousChatReportReason;
  // OTHER 사유일 때만 필수이며 최대 500자
  description?: string;
}

export interface AnonymousChatReport {
  reportId: number;
  createdAt: string;
}

interface AnonymousChatReportResponse {
  message: string;
  data: AnonymousChatReport;
}

interface AnonymousChatReportErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

export const ANONYMOUS_CHAT_REPORT_DESCRIPTION_MAX_LENGTH = 500;

const REPORT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "해당 익명대화에 접근할 수 없습니다.",
  404: "익명대화방을 찾을 수 없습니다.",
  409: "이미 신고한 익명대화입니다.",
  422: "입력 값이 유효하지 않습니다. 입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
};

function getRetryAfterSeconds(errorResponse: AnonymousChatReportErrorResponse | null) {
  const retryAfterSeconds = errorResponse?.data?.retryAfterSeconds;

  return typeof retryAfterSeconds === "number" && Number.isFinite(retryAfterSeconds)
    ? Math.max(0, Math.ceil(retryAfterSeconds))
    : undefined;
}

export async function reportAnonymousChatUser(roomId: number, request: AnonymousChatReportRequest) {
  // TODO: 익명 대화방 생성 API 연동 후 실제 생성된 roomId로 신고 API 동작 재확인
  const response = await apiFetch(API_ENDPOINTS.anonymousChats.report(roomId), {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AnonymousChatReportErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        REPORT_ERROR_MESSAGES[response.status] ??
        "신고를 접수하지 못했습니다.",
      response.status,
      getRetryAfterSeconds(errorResponse),
    );
  }

  const { data } = (await response.json()) as AnonymousChatReportResponse;

  return data;
}
