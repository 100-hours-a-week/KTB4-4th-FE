// 탭당 하나의 알림 SSE 연결을 열고 닫으며 재연결과 복구 기준 시각을 관리하는 모듈
"use client";

import { ApiRequestError, redirectToLogin, refreshAccessToken } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { parseServerDateTime } from "@/lib/parseServerDateTime";
import type {
  NotificationConnectedEvent,
  NotificationCreatedEvent,
  NotificationHeartbeatEvent,
} from "@/types/notification";

const INITIAL_RECONNECT_DELAY_MS = 10_000;
const MAX_RECONNECT_DELAY_MS = 5 * 60_000;

export interface NotificationStreamHandlers {
  // previousServerTime이 있으면 재연결이므로 그 시각 이후 놓친 알림을 조회해야 함
  onConnected?: (event: NotificationConnectedEvent, previousServerTime: string | null) => void;
  onNotification?: (event: NotificationCreatedEvent) => void;
}

let eventSource: EventSource | null = null;
let handlers: NotificationStreamHandlers = {};
let lastServerTime: string | null = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isStreamOpen = false;

function parseEventData<T>(event: MessageEvent<string>) {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

function isLaterThanLastServerTime(serverTime: string) {
  if (!lastServerTime) return true;

  return parseServerDateTime(serverTime) > parseServerDateTime(lastServerTime);
}

export function updateNotificationServerTime(serverTime: string) {
  if (isLaterThanLastServerTime(serverTime)) {
    lastServerTime = serverTime;
  }
}

export function getNotificationServerTime() {
  return lastServerTime;
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function closeEventSource() {
  eventSource?.close();
  eventSource = null;
}

function handleConnected(event: MessageEvent<string>) {
  const data = parseEventData<NotificationConnectedEvent>(event);

  if (!data) return;

  const previousServerTime = lastServerTime;

  reconnectAttempt = 0;
  updateNotificationServerTime(data.connectedAt);
  handlers.onConnected?.(data, previousServerTime);
}

function handleHeartbeat(event: MessageEvent<string>) {
  const data = parseEventData<NotificationHeartbeatEvent>(event);

  if (data) {
    updateNotificationServerTime(data.serverTime);
  }
}

function handleNotification(event: MessageEvent<string>) {
  const data = parseEventData<NotificationCreatedEvent>(event);

  if (data) {
    handlers.onNotification?.(data);
  }
}

function scheduleReconnect() {
  const delay = Math.min(
    INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttempt,
    MAX_RECONNECT_DELAY_MS,
  );

  reconnectAttempt += 1;
  clearReconnectTimer();
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    if (isStreamOpen) {
      connect();
    }
  }, delay);
}

// EventSource는 HTTP 상태 코드를 알 수 없으므로 401·429·503 등을 구분하지 않고
// 토큰 재발급 시도 후 지수 백오프로 재연결함
async function recoverClosedConnection() {
  closeEventSource();

  try {
    await refreshAccessToken();
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      closeNotificationStream();
      redirectToLogin();
      return;
    }
  }

  if (isStreamOpen) {
    scheduleReconnect();
  }
}

function connect() {
  closeEventSource();

  const source = new EventSource(API_ENDPOINTS.notifications.stream, { withCredentials: true });

  source.addEventListener("connected", handleConnected);
  source.addEventListener("heartbeat", handleHeartbeat);
  source.addEventListener("notification.created", handleNotification);
  source.onerror = () => {
    // CONNECTING 상태는 30분 만료 등으로 브라우저가 자동 재연결 중이므로 그대로 둠
    if (source !== eventSource || source.readyState !== EventSource.CLOSED) return;

    void recoverClosedConnection();
  };

  eventSource = source;
}

export function openNotificationStream(nextHandlers: NotificationStreamHandlers) {
  handlers = nextHandlers;

  if (isStreamOpen) return;

  isStreamOpen = true;
  connect();
}

// 로그아웃·탈퇴 전에 호출해 연결과 복구 기준 시각을 정리함
export function closeNotificationStream() {
  isStreamOpen = false;
  handlers = {};
  lastServerTime = null;
  reconnectAttempt = 0;
  clearReconnectTimer();
  closeEventSource();
}
