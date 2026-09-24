// AI 대화 시작 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type AiConversationStatus = "PENDING" | "ACTIVE" | "ANALYZING" | "COMPLETED" | "EXPIRED";

export interface AiConversation {
  conversationId: number;
  status: AiConversationStatus;
}

interface StartAiConversationResponse {
  message: string;
  data: AiConversation;
}

interface StartAiConversationErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  401: "로그인이 필요합니다.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: StartAiConversationErrorResponse | null,
) {
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

export async function startAiConversation() {
  const response = await apiFetch(API_ENDPOINTS.ai.conversations, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as StartAiConversationErrorResponse | null;
    const message =
      errorResponse?.message ??
      DEFAULT_ERROR_MESSAGES[response.status] ??
      "AI 대화를 시작하지 못했습니다.";

    throw new ApiRequestError(
      message,
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as StartAiConversationResponse;
  return data;
}
