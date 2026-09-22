// 오류 피드백 전송 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type ProblemType = "connection" | "display" | "other";

export interface ErrorReportRequest {
  problemType: ProblemType;
  detail: string;
}

export interface ErrorReportData {
  errorReportId: number;
}

interface ErrorReportResponse {
  message: string;
  data: ErrorReportData;
}

interface ErrorReportErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

export async function submitErrorReport(payload: ErrorReportRequest, idempotencyKey: string) {
  const response = await apiFetch(API_ENDPOINTS.errorReports, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as ErrorReportErrorResponse | null;
    const message = errorResponse?.message ?? "오류 피드백을 전송하지 못했습니다.";

    throw new ApiRequestError(message, response.status);
  }

  const { data } = (await response.json()) as ErrorReportResponse;
  return data;
}
