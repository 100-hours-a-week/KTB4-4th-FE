// 익명대화 STOMP 클라이언트의 단일 연결과 프레임 전달 생명주기 관리
"use client";

import { Client, Versions, type IFrame, type IMessage } from "@stomp/stompjs";

import { redirectToLogin, refreshAccessToken } from "@/lib/api/client";
import {
  ANONYMOUS_CHAT_HEARTBEAT_MS,
  ANONYMOUS_CHAT_SOCKET_PATH,
  ANONYMOUS_CHAT_STOMP_DESTINATIONS,
  parseAnonymousChatStompError,
  type AnonymousChatStompErrorPayload,
} from "@/lib/websocket/anonymousChatProtocol";
import { useAnonymousChatStore } from "@/stores/anonymousChatStore";

const INITIAL_RECONNECT_DELAY_MS = 5_000;
const MAX_RECONNECT_DELAY_MS = 5 * 60_000;
const ONBOARDING_PATH = "/onboarding";

type PendingStompError =
  { type: "known"; error: AnonymousChatStompErrorPayload } | { type: "unknown" } | null;

export interface AnonymousChatSocketConnectionEvent {
  isReconnect: boolean;
}

export interface AnonymousChatSocketListener {
  onConnected?: (event: AnonymousChatSocketConnectionEvent) => void;
  onDisconnected?: (event: CloseEvent) => void;
  onMessage?: (message: IMessage) => void;
  onStompError?: (frame: IFrame) => void;
}

let client: Client | null = null;
let hasConnected = false;
let lifecycleVersion = 0;
let shouldMaintainConnection = false;
let pendingStompError: PendingStompError = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isExplicitDeactivationInProgress = false;
const listeners = new Set<AnonymousChatSocketListener>();

function getBrokerUrl() {
  const brokerUrl = new URL(ANONYMOUS_CHAT_SOCKET_PATH, window.location.origin);

  brokerUrl.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return brokerUrl.toString();
}

function notifyListeners(notify: (listener: AnonymousChatSocketListener) => void) {
  listeners.forEach((listener) => {
    try {
      notify(listener);
    } catch (error) {
      // 한 리스너의 오류가 다른 화면과 이벤트 처리기의 프레임 수신을 막지 않도록 격리함
      console.error("익명대화 WebSocket 이벤트 처리에 실패했습니다.", error);
    }
  });
}

function clearReconnectTimer() {
  if (!reconnectTimer) return;

  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function activateClient() {
  const socketClient = getClient();

  if (!shouldMaintainConnection || socketClient.active) return;

  lifecycleVersion += 1;
  useAnonymousChatStore
    .getState()
    .setConnectionStatus(hasConnected ? "reconnecting" : "connecting");
  socketClient.activate();
}

function scheduleReconnect(delayMs: number) {
  if (!shouldMaintainConnection) return;

  clearReconnectTimer();
  useAnonymousChatStore.getState().setConnectionStatus("reconnecting");
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    activateClient();
  }, delayMs);
}

function scheduleBackoffReconnect() {
  const delayMs = Math.min(
    INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttempt,
    MAX_RECONNECT_DELAY_MS,
  );

  reconnectAttempt += 1;
  scheduleReconnect(delayMs);
}

function handleConnect(socketClient: Client) {
  const isReconnect = hasConnected;

  hasConnected = true;
  pendingStompError = null;
  reconnectAttempt = 0;
  clearReconnectTimer();
  useAnonymousChatStore.getState().setConnectionError(null);
  useAnonymousChatStore.getState().setConnectionStatus("connected");

  socketClient.subscribe(ANONYMOUS_CHAT_STOMP_DESTINATIONS.events, (message) => {
    notifyListeners((listener) => listener.onMessage?.(message));
  });

  notifyListeners((listener) => listener.onConnected?.({ isReconnect }));
}

async function recoverFromStompError(error: AnonymousChatStompErrorPayload) {
  switch (error.code) {
    case "COMMON_UNAUTHORIZED":
      try {
        await refreshAccessToken();
      } catch {
        shouldMaintainConnection = false;
        useAnonymousChatStore.getState().setConnectionStatus("disconnected");
        redirectToLogin();
        return;
      }

      activateClient();
      return;
    case "USER_BLOCKED":
      shouldMaintainConnection = false;
      useAnonymousChatStore.getState().setConnectionStatus("disconnected");
      return;
    case "USER_ONBOARDING_REQUIRED":
      shouldMaintainConnection = false;
      useAnonymousChatStore.getState().setConnectionStatus("disconnected");
      window.location.replace(ONBOARDING_PATH);
      return;
    case "COMMON_TOO_MANY_REQUESTS": {
      const retryAfterSeconds = error.data?.retryAfterSeconds;
      const delayMs =
        retryAfterSeconds === undefined
          ? INITIAL_RECONNECT_DELAY_MS
          : Math.ceil(retryAfterSeconds) * 1_000;

      scheduleReconnect(delayMs);
      return;
    }
    case "COMMON_INTERNAL_SERVER_ERROR":
      scheduleBackoffReconnect();
  }
}

async function recoverClosedConnection(socketClient: Client, closedLifecycleVersion: number) {
  const stompError = pendingStompError;

  pendingStompError = null;
  await socketClient.deactivate();

  if (closedLifecycleVersion !== lifecycleVersion) return;

  if (!shouldMaintainConnection) {
    useAnonymousChatStore.getState().setConnectionStatus("disconnected");
    return;
  }

  if (!stompError) {
    scheduleBackoffReconnect();
    return;
  }

  if (stompError.type === "unknown") {
    shouldMaintainConnection = false;
    useAnonymousChatStore.getState().setConnectionStatus("disconnected");
    return;
  }

  await recoverFromStompError(stompError.error);
}

function handleStompError(frame: IFrame) {
  const error = parseAnonymousChatStompError(frame.body);

  pendingStompError = error ? { type: "known", error } : { type: "unknown" };

  if (error) {
    useAnonymousChatStore.getState().setConnectionError(error);
  }

  notifyListeners((listener) => listener.onStompError?.(frame));
}

function handleWebSocketClose(socketClient: Client, event: CloseEvent) {
  const closedLifecycleVersion = lifecycleVersion;

  useAnonymousChatStore
    .getState()
    .setConnectionStatus(shouldMaintainConnection ? "reconnecting" : "disconnected");

  notifyListeners((listener) => listener.onDisconnected?.(event));

  // 명시적 종료 중 다시 activate된 경우 라이브러리가 종료 완료 직후 새 연결을 시작함
  if (isExplicitDeactivationInProgress) return;

  void recoverClosedConnection(socketClient, closedLifecycleVersion);
}

function createClient() {
  const socketClient = new Client({
    brokerURL: getBrokerUrl(),
    stompVersions: new Versions([Versions.V1_2]),
    heartbeatIncoming: ANONYMOUS_CHAT_HEARTBEAT_MS.incoming,
    heartbeatOutgoing: ANONYMOUS_CHAT_HEARTBEAT_MS.outgoing,
    reconnectDelay: 0,
    debug: () => undefined,
  });

  socketClient.onConnect = () => handleConnect(socketClient);
  socketClient.onStompError = handleStompError;
  socketClient.onWebSocketClose = (event) => handleWebSocketClose(socketClient, event);

  return socketClient;
}

function getClient() {
  client ??= createClient();

  return client;
}

export function addAnonymousChatSocketListener(listener: AnonymousChatSocketListener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function openAnonymousChatSocket() {
  shouldMaintainConnection = true;
  clearReconnectTimer();
  activateClient();
}

export async function closeAnonymousChatSocket() {
  const closeVersion = ++lifecycleVersion;
  const socketClient = client;

  shouldMaintainConnection = false;
  pendingStompError = null;
  reconnectAttempt = 0;
  clearReconnectTimer();

  if (socketClient) {
    isExplicitDeactivationInProgress = true;
    await socketClient.deactivate();
  }

  // React 개발 모드의 재마운트처럼 종료 중 새 연결 요청이 들어오면 새 생명주기를 유지함
  if (closeVersion !== lifecycleVersion) {
    isExplicitDeactivationInProgress = false;
    return;
  }

  isExplicitDeactivationInProgress = false;
  hasConnected = false;
  listeners.clear();
  useAnonymousChatStore.getState().setConnectionError(null);
  useAnonymousChatStore.getState().setConnectionStatus("disconnected");
}
