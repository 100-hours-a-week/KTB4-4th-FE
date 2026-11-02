// 익명대화 WebSocket·STOMP 연결 경로와 프로토콜 공통 정의

export const ANONYMOUS_CHAT_SOCKET_PATH = "/ws/v1/anonymous-chats";

export const ANONYMOUS_CHAT_STOMP_DESTINATIONS = {
  events: "/user/queue/anonymous-chats",
  messages: (roomId: number) => `/app/anonymous-chats/${roomId}/messages`,
} as const;

export const ANONYMOUS_CHAT_MESSAGE_LENGTH = {
  min: 1,
  max: 500,
} as const;

export const ANONYMOUS_CHAT_HEARTBEAT_MS = {
  incoming: 10_000,
  outgoing: 10_000,
} as const;

export type AnonymousChatConnectionStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export type AnonymousChatStompErrorCode =
  | "COMMON_UNAUTHORIZED"
  | "USER_BLOCKED"
  | "USER_ONBOARDING_REQUIRED"
  | "COMMON_TOO_MANY_REQUESTS"
  | "COMMON_INTERNAL_SERVER_ERROR";

export interface AnonymousChatStompErrorPayload {
  code: AnonymousChatStompErrorCode;
  message: string;
  data: {
    retryAfterSeconds?: number;
  } | null;
}

const ANONYMOUS_CHAT_STOMP_ERROR_CODES = new Set<AnonymousChatStompErrorCode>([
  "COMMON_UNAUTHORIZED",
  "USER_BLOCKED",
  "USER_ONBOARDING_REQUIRED",
  "COMMON_TOO_MANY_REQUESTS",
  "COMMON_INTERNAL_SERVER_ERROR",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAnonymousChatStompError(body: string): AnonymousChatStompErrorPayload | null {
  let value: unknown;

  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }

  if (
    !isRecord(value) ||
    typeof value.code !== "string" ||
    !ANONYMOUS_CHAT_STOMP_ERROR_CODES.has(value.code as AnonymousChatStompErrorCode) ||
    typeof value.message !== "string" ||
    (value.data !== null && !isRecord(value.data))
  ) {
    return null;
  }

  const retryAfterSeconds = value.data?.retryAfterSeconds;

  if (
    retryAfterSeconds !== undefined &&
    (typeof retryAfterSeconds !== "number" ||
      !Number.isFinite(retryAfterSeconds) ||
      retryAfterSeconds < 0)
  ) {
    return null;
  }

  return {
    code: value.code as AnonymousChatStompErrorCode,
    message: value.message,
    data: value.data === null ? null : { retryAfterSeconds },
  };
}
