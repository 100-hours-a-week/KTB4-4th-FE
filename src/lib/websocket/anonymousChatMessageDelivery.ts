// 익명대화 메시지의 신규 전송·재전송과 서버 응답 대기시간 관리 서비스
"use client";

import {
  AnonymousChatMessagePublishError,
  publishAnonymousChatMessage,
} from "@/lib/websocket/anonymousChatSocket";
import {
  type AnonymousChatPendingMessageFailure,
  useAnonymousChatPendingMessageStore,
} from "@/stores/anonymousChatPendingMessageStore";

export const ANONYMOUS_CHAT_MESSAGE_RESPONSE_TIMEOUT_MS = 10_000;

const RESPONSE_TIMEOUT_CODE = "RESPONSE_TIMEOUT";
const RESPONSE_TIMEOUT_MESSAGE = "메시지 전송 결과를 확인하지 못했습니다. 다시 시도해 주세요.";
const responseTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export interface SendAnonymousChatMessageRequest {
  roomId: number;
  content: string;
}

export interface FailAnonymousChatMessageRequest {
  clientMessageId: string;
  code: string;
  message: string;
  canRetry: boolean;
  retryAfterSeconds?: number;
}

function clearResponseTimeout(clientMessageId: string) {
  const timeout = responseTimeouts.get(clientMessageId);

  if (timeout) {
    clearTimeout(timeout);
    responseTimeouts.delete(clientMessageId);
  }
}

function markMessageFailed(
  clientMessageId: string,
  failure: Omit<AnonymousChatPendingMessageFailure, "failedAt">,
) {
  useAnonymousChatPendingMessageStore.getState().markPendingMessageFailed(clientMessageId, {
    ...failure,
    failedAt: new Date().toISOString(),
  });
}

function scheduleResponseTimeout(clientMessageId: string, lastAttemptAt: string) {
  clearResponseTimeout(clientMessageId);

  const timeout = setTimeout(() => {
    responseTimeouts.delete(clientMessageId);

    const pendingMessage =
      useAnonymousChatPendingMessageStore.getState().messagesByClientMessageId[clientMessageId];

    // 이전 전송 시도의 타이머가 새 재전송 상태를 실패로 되돌리는 상황 방지
    if (
      !pendingMessage ||
      pendingMessage.status !== "SENDING" ||
      pendingMessage.lastAttemptAt !== lastAttemptAt
    ) {
      return;
    }

    markMessageFailed(clientMessageId, {
      code: RESPONSE_TIMEOUT_CODE,
      message: RESPONSE_TIMEOUT_MESSAGE,
      canRetry: true,
    });
  }, ANONYMOUS_CHAT_MESSAGE_RESPONSE_TIMEOUT_MS);

  responseTimeouts.set(clientMessageId, timeout);
}

function publishPendingMessage(clientMessageId: string) {
  const pendingStore = useAnonymousChatPendingMessageStore.getState();
  const pendingMessage = pendingStore.messagesByClientMessageId[clientMessageId];

  if (!pendingMessage) {
    throw new Error("전송할 익명대화 메시지를 찾을 수 없습니다.");
  }

  const lastAttemptAt = new Date().toISOString();
  pendingStore.markPendingMessageSending(clientMessageId, lastAttemptAt);

  try {
    publishAnonymousChatMessage({
      roomId: pendingMessage.roomId,
      clientMessageId,
      content: pendingMessage.content,
    });
    scheduleResponseTimeout(clientMessageId, lastAttemptAt);
  } catch (error) {
    clearResponseTimeout(clientMessageId);
    markMessageFailed(clientMessageId, {
      code:
        error instanceof AnonymousChatMessagePublishError ? error.code : "MESSAGE_PUBLISH_FAILED",
      message: error instanceof Error ? error.message : "메시지를 전송하지 못했습니다.",
      canRetry:
        !(error instanceof AnonymousChatMessagePublishError) || error.code === "NOT_CONNECTED",
    });
    throw error;
  }
}

export function sendAnonymousChatMessage({ roomId, content }: SendAnonymousChatMessageRequest) {
  const clientMessageId = crypto.randomUUID();
  const sentAt = new Date().toISOString();

  useAnonymousChatPendingMessageStore.getState().addPendingMessage({
    roomId,
    clientMessageId,
    content,
    sentAt,
    lastAttemptAt: sentAt,
  });
  publishPendingMessage(clientMessageId);

  return clientMessageId;
}

export function retryAnonymousChatMessage(clientMessageId: string) {
  const pendingMessage =
    useAnonymousChatPendingMessageStore.getState().messagesByClientMessageId[clientMessageId];

  if (!pendingMessage || pendingMessage.status !== "FAILED" || !pendingMessage.failure?.canRetry) {
    throw new Error("다시 전송할 수 없는 익명대화 메시지입니다.");
  }

  const retryAvailableAt =
    Date.parse(pendingMessage.failure.failedAt) +
    (pendingMessage.failure.retryAfterSeconds ?? 0) * 1_000;

  if (Date.now() < retryAvailableAt) {
    throw new Error("메시지 재전송 대기시간이 지나지 않았습니다.");
  }

  publishPendingMessage(clientMessageId);
}

export function confirmAnonymousChatMessage(clientMessageId: string) {
  clearResponseTimeout(clientMessageId);
  useAnonymousChatPendingMessageStore.getState().removePendingMessage(clientMessageId);
}

export function failAnonymousChatMessage({
  clientMessageId,
  code,
  message,
  canRetry,
  retryAfterSeconds,
}: FailAnonymousChatMessageRequest) {
  clearResponseTimeout(clientMessageId);
  markMessageFailed(clientMessageId, { code, message, canRetry, retryAfterSeconds });
}

export function resetAnonymousChatMessageDelivery() {
  responseTimeouts.forEach((timeout) => clearTimeout(timeout));
  responseTimeouts.clear();
  useAnonymousChatPendingMessageStore.getState().reset();
}
