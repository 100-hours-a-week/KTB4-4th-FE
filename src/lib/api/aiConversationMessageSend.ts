// AI 대화 사용자 메시지 전송 API 요청과 접수(202)·완료(200) 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AiConversationAcceptedEvent, AiConversationCompletedEvent } from "@/types/chat";

export interface SendAiConversationMessageRequest {
  clientMessageId: string;
  content: string;
}

// 202는 답변이 스트림으로 오고, 200은 같은 clientMessageId로 재전송했는데 답변이 이미 완료된 경우
export type SendAiConversationMessageResult =
  | { type: "ACCEPTED"; data: AiConversationAcceptedEvent }
  | { type: "COMPLETED"; data: AiConversationCompletedEvent };

interface SendAiConversationMessageResponse<T> {
  message: string;
  data: T;
}

interface SendAiConversationMessageErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

interface SendAiConversationMessageParams extends SendAiConversationMessageRequest {
  conversationId: number;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "접근 권한이 없습니다.",
  404: "AI 대화를 찾을 수 없습니다.",
  409: "AI 대화의 사용자 입력이 잠겨 있습니다.",
  410: "AI 대화 세션이 만료되었습니다.",
  422: "입력값이 유효하지 않습니다. 입력 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: SendAiConversationMessageErrorResponse | null,
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

export async function sendAiConversationMessage({
  conversationId,
  clientMessageId,
  content,
}: SendAiConversationMessageParams): Promise<SendAiConversationMessageResult> {
  const response = await apiFetch(API_ENDPOINTS.ai.conversationMessages(conversationId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clientMessageId, content } satisfies SendAiConversationMessageRequest),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as SendAiConversationMessageErrorResponse | null;
    const message =
      errorResponse?.message ??
      DEFAULT_ERROR_MESSAGES[response.status] ??
      "메시지를 전송하지 못했습니다.";

    throw new ApiRequestError(
      message,
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  if (response.status === 202) {
    const { data } =
      (await response.json()) as SendAiConversationMessageResponse<AiConversationAcceptedEvent>;

    return { type: "ACCEPTED", data };
  }

  const { data } =
    (await response.json()) as SendAiConversationMessageResponse<AiConversationCompletedEvent>;

  return { type: "COMPLETED", data };
}
