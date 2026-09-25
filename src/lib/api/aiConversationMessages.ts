// AI 대화 메시지 목록 조회 API 요청과 커서 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type AiMessageRole = "AI" | "USER";

export interface AiConversationMessage {
  messageId: number;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

interface AiConversationMessagesData {
  items: AiConversationMessage[];
}

export interface AiConversationMessagesPage extends AiConversationMessagesData {
  nextCursor: string | null;
  hasNext: boolean;
}

interface AiConversationMessagesResponse {
  message: string;
  data: AiConversationMessagesData;
  nextCursor: string | null;
  hasNext: boolean;
}

interface AiConversationMessagesErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

interface GetAiConversationMessagesParams {
  conversationId: number;
  size?: number;
  cursor?: string;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "접근 권한이 없습니다.",
  404: "AI 대화를 찾을 수 없습니다.",
  422: "입력값이 유효하지 않습니다. 입력 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: AiConversationMessagesErrorResponse | null,
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

export async function getAiConversationMessages({
  conversationId,
  size = 20,
  cursor,
}: GetAiConversationMessagesParams) {
  const searchParams = new URLSearchParams({ size: String(size) });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await apiFetch(
    `${API_ENDPOINTS.ai.conversationMessages(conversationId)}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AiConversationMessagesErrorResponse | null;
    const message =
      errorResponse?.message ??
      DEFAULT_ERROR_MESSAGES[response.status] ??
      "대화 메시지를 불러오지 못했습니다.";

    throw new ApiRequestError(
      message,
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data, nextCursor, hasNext } = (await response.json()) as AiConversationMessagesResponse;

  return {
    items: data.items,
    nextCursor,
    hasNext,
  } satisfies AiConversationMessagesPage;
}
