// 익명대화 STOMP MESSAGE 본문의 런타임 검증과 이벤트별 스토어 분배
"use client";

import { redirectToLogin } from "@/lib/api/client";
import {
  confirmAnonymousChatMessage,
  failAnonymousChatMessage,
} from "@/lib/websocket/anonymousChatMessageDelivery";
import { addAnonymousChatSocketListener } from "@/lib/websocket/anonymousChatSocket";
import { useAnonymousChatStore } from "@/stores/anonymousChatStore";

import type { IMessage } from "@stomp/stompjs";

export interface AnonymousChatMessageSentEvent {
  type: "ANONYMOUS_CHAT_MESSAGE_SENT";
  data: {
    roomId: number;
    clientMessageId: string;
    messageId: number;
    content: string;
    sentAt: string;
  };
}

export interface AnonymousChatMessageReceivedEvent {
  type: "ANONYMOUS_CHAT_MESSAGE_RECEIVED";
  data: {
    roomId: number;
    messageId: number;
    sender: "OTHER";
    content: string;
    sentAt: string;
  };
}

export interface AnonymousChatMessageReadEvent {
  type: "ANONYMOUS_CHAT_MESSAGE_READ";
  data: {
    roomId: number;
    lastReadMessageId: number;
    readAt: string;
  };
}

export interface AnonymousChatRoomEndedEvent {
  type: "ANONYMOUS_CHAT_ROOM_ENDED";
  data: {
    roomId: number;
    roomStatus: "ENDED";
    endedReason: "PARTNER_LEFT";
    endedAt: string;
  };
}

export interface AnonymousChatMessageErrorEvent {
  type: "ANONYMOUS_CHAT_ERROR";
  code: string;
  message: string;
  data: {
    roomId?: number | null;
    clientMessageId?: string | null;
    retryAfterSeconds?: number;
  } | null;
}

export type AnonymousChatEvent =
  | AnonymousChatMessageSentEvent
  | AnonymousChatMessageReceivedEvent
  | AnonymousChatMessageReadEvent
  | AnonymousChatRoomEndedEvent
  | AnonymousChatMessageErrorEvent;

export type AnonymousChatEventHandler = (event: AnonymousChatEvent) => void;

const eventHandlers = new Set<AnonymousChatEventHandler>();
let removeSocketListener: (() => void) | null = null;
const ONBOARDING_PATH = "/onboarding";
const RETRYABLE_MESSAGE_ERROR_CODES = new Set([
  "COMMON_TOO_MANY_REQUESTS",
  "COMMON_INTERNAL_SERVER_ERROR",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isDateTimeString(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function parseMessageSent(value: Record<string, unknown>): AnonymousChatMessageSentEvent | null {
  const data = value.data;

  if (
    !isRecord(data) ||
    !isPositiveSafeInteger(data.roomId) ||
    !isNonEmptyString(data.clientMessageId) ||
    !isPositiveSafeInteger(data.messageId) ||
    typeof data.content !== "string" ||
    !isDateTimeString(data.sentAt)
  ) {
    return null;
  }

  return {
    type: "ANONYMOUS_CHAT_MESSAGE_SENT",
    data: {
      roomId: data.roomId,
      clientMessageId: data.clientMessageId,
      messageId: data.messageId,
      content: data.content,
      sentAt: data.sentAt,
    },
  };
}

function parseMessageReceived(
  value: Record<string, unknown>,
): AnonymousChatMessageReceivedEvent | null {
  const data = value.data;

  if (
    !isRecord(data) ||
    !isPositiveSafeInteger(data.roomId) ||
    !isPositiveSafeInteger(data.messageId) ||
    data.sender !== "OTHER" ||
    typeof data.content !== "string" ||
    !isDateTimeString(data.sentAt)
  ) {
    return null;
  }

  return {
    type: "ANONYMOUS_CHAT_MESSAGE_RECEIVED",
    data: {
      roomId: data.roomId,
      messageId: data.messageId,
      sender: "OTHER",
      content: data.content,
      sentAt: data.sentAt,
    },
  };
}

function parseMessageRead(value: Record<string, unknown>): AnonymousChatMessageReadEvent | null {
  const data = value.data;

  if (
    !isRecord(data) ||
    !isPositiveSafeInteger(data.roomId) ||
    !isPositiveSafeInteger(data.lastReadMessageId) ||
    !isDateTimeString(data.readAt)
  ) {
    return null;
  }

  return {
    type: "ANONYMOUS_CHAT_MESSAGE_READ",
    data: {
      roomId: data.roomId,
      lastReadMessageId: data.lastReadMessageId,
      readAt: data.readAt,
    },
  };
}

function parseRoomEnded(value: Record<string, unknown>): AnonymousChatRoomEndedEvent | null {
  const data = value.data;

  if (
    !isRecord(data) ||
    !isPositiveSafeInteger(data.roomId) ||
    data.roomStatus !== "ENDED" ||
    data.endedReason !== "PARTNER_LEFT" ||
    !isDateTimeString(data.endedAt)
  ) {
    return null;
  }

  return {
    type: "ANONYMOUS_CHAT_ROOM_ENDED",
    data: {
      roomId: data.roomId,
      roomStatus: "ENDED",
      endedReason: "PARTNER_LEFT",
      endedAt: data.endedAt,
    },
  };
}

function parseMessageError(value: Record<string, unknown>): AnonymousChatMessageErrorEvent | null {
  const data = value.data;

  if (!isNonEmptyString(value.code) || !isNonEmptyString(value.message)) {
    return null;
  }

  if (data === null) {
    return {
      type: "ANONYMOUS_CHAT_ERROR",
      code: value.code,
      message: value.message,
      data: null,
    };
  }

  if (
    !isRecord(data) ||
    (data.roomId !== undefined && data.roomId !== null && !isPositiveSafeInteger(data.roomId)) ||
    (data.clientMessageId !== undefined &&
      data.clientMessageId !== null &&
      !isNonEmptyString(data.clientMessageId)) ||
    (data.retryAfterSeconds !== undefined && !isNonNegativeFiniteNumber(data.retryAfterSeconds))
  ) {
    return null;
  }

  return {
    type: "ANONYMOUS_CHAT_ERROR",
    code: value.code,
    message: value.message,
    data,
  };
}

export function parseAnonymousChatEvent(body: string): AnonymousChatEvent | null {
  let value: unknown;

  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }

  if (!isRecord(value) || !isNonEmptyString(value.type)) {
    return null;
  }

  switch (value.type) {
    case "ANONYMOUS_CHAT_MESSAGE_SENT":
      return parseMessageSent(value);
    case "ANONYMOUS_CHAT_MESSAGE_RECEIVED":
      return parseMessageReceived(value);
    case "ANONYMOUS_CHAT_MESSAGE_READ":
      return parseMessageRead(value);
    case "ANONYMOUS_CHAT_ROOM_ENDED":
      return parseRoomEnded(value);
    case "ANONYMOUS_CHAT_ERROR":
      return parseMessageError(value);
    default:
      return null;
  }
}

function applyEventToStore(event: AnonymousChatEvent) {
  const store = useAnonymousChatStore.getState();

  switch (event.type) {
    case "ANONYMOUS_CHAT_MESSAGE_SENT":
      store.applyRealtimeMessage({
        roomId: event.data.roomId,
        clientMessageId: event.data.clientMessageId,
        messageId: event.data.messageId,
        content: event.data.content,
        isMine: true,
        unreadCount: 1,
        sentAt: event.data.sentAt,
      });
      confirmAnonymousChatMessage(event.data.clientMessageId);
      break;
    case "ANONYMOUS_CHAT_MESSAGE_RECEIVED":
      store.applyRealtimeMessage(
        {
          roomId: event.data.roomId,
          messageId: event.data.messageId,
          content: event.data.content,
          isMine: false,
          unreadCount: 0,
          sentAt: event.data.sentAt,
        },
        { incrementRoomUnreadCount: true },
      );
      break;
    case "ANONYMOUS_CHAT_MESSAGE_READ":
      store.markOwnMessagesRead(event.data.roomId, event.data.lastReadMessageId);
      break;
    case "ANONYMOUS_CHAT_ROOM_ENDED":
      store.markRoomEnded(event.data.roomId, {
        endedReason: event.data.endedReason,
        endedAt: event.data.endedAt,
      });
      break;
    case "ANONYMOUS_CHAT_ERROR":
      if (event.data?.clientMessageId) {
        failAnonymousChatMessage({
          clientMessageId: event.data.clientMessageId,
          code: event.code,
          message: event.message,
          canRetry: RETRYABLE_MESSAGE_ERROR_CODES.has(event.code),
          retryAfterSeconds: event.data.retryAfterSeconds,
        });
      }

      if (event.code === "ANONYMOUS_CHAT_ROOM_ENDED" && event.data?.roomId) {
        store.markRoomEnded(event.data.roomId);
      }

      if (event.code === "USER_ONBOARDING_REQUIRED") {
        window.location.replace(ONBOARDING_PATH);
      } else if (event.code === "USER_WITHDRAWN") {
        redirectToLogin();
      }
      break;
  }
}

function notifyEventHandlers(event: AnonymousChatEvent) {
  eventHandlers.forEach((handler) => {
    try {
      handler(event);
    } catch (error) {
      console.error("익명대화 이벤트 처리에 실패했습니다.", error);
    }
  });
}

function handleMessage(message: IMessage) {
  const event = parseAnonymousChatEvent(message.body);

  if (!event) return;

  applyEventToStore(event);
  notifyEventHandlers(event);
}

export function addAnonymousChatEventHandler(handler: AnonymousChatEventHandler) {
  eventHandlers.add(handler);

  return () => {
    eventHandlers.delete(handler);
  };
}

export function startAnonymousChatEventDispatch() {
  if (removeSocketListener) return;

  removeSocketListener = addAnonymousChatSocketListener({ onMessage: handleMessage });
}

export function stopAnonymousChatEventDispatch() {
  removeSocketListener?.();
  removeSocketListener = null;
  eventHandlers.clear();
}
