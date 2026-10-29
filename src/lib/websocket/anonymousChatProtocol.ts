// 익명대화 WebSocket·STOMP 연결 경로와 프로토콜 공통 정의

export const ANONYMOUS_CHAT_SOCKET_PATH = "/ws/v1/anonymous-chats";

export const ANONYMOUS_CHAT_STOMP_DESTINATIONS = {
  events: "/user/queue/anonymous-chats",
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
