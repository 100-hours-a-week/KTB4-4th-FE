// 익명대화 STOMP 클라이언트의 단일 연결과 프레임 전달 생명주기 관리
"use client";

import { Client, Versions, type IFrame, type IMessage } from "@stomp/stompjs";

import {
  ANONYMOUS_CHAT_HEARTBEAT_MS,
  ANONYMOUS_CHAT_SOCKET_PATH,
  ANONYMOUS_CHAT_STOMP_DESTINATIONS,
} from "@/lib/websocket/anonymousChatProtocol";
import { useAnonymousChatStore } from "@/stores/anonymousChatStore";

const RECONNECT_DELAY_MS = 5_000;

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

function handleConnect(socketClient: Client) {
  const isReconnect = hasConnected;

  hasConnected = true;
  useAnonymousChatStore.getState().setConnectionError(null);
  useAnonymousChatStore.getState().setConnectionStatus("connected");

  socketClient.subscribe(ANONYMOUS_CHAT_STOMP_DESTINATIONS.events, (message) => {
    notifyListeners((listener) => listener.onMessage?.(message));
  });

  notifyListeners((listener) => listener.onConnected?.({ isReconnect }));
}

function handleWebSocketClose(socketClient: Client, event: CloseEvent) {
  useAnonymousChatStore
    .getState()
    .setConnectionStatus(socketClient.active ? "reconnecting" : "disconnected");

  notifyListeners((listener) => listener.onDisconnected?.(event));
}

function createClient() {
  const socketClient = new Client({
    brokerURL: getBrokerUrl(),
    stompVersions: new Versions([Versions.V1_2]),
    heartbeatIncoming: ANONYMOUS_CHAT_HEARTBEAT_MS.incoming,
    heartbeatOutgoing: ANONYMOUS_CHAT_HEARTBEAT_MS.outgoing,
    reconnectDelay: RECONNECT_DELAY_MS,
    debug: () => undefined,
  });

  socketClient.onConnect = () => handleConnect(socketClient);
  socketClient.onStompError = (frame) => {
    notifyListeners((listener) => listener.onStompError?.(frame));
  };
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
  const socketClient = getClient();

  if (socketClient.active) return;

  lifecycleVersion += 1;
  useAnonymousChatStore
    .getState()
    .setConnectionStatus(hasConnected ? "reconnecting" : "connecting");
  socketClient.activate();
}

export async function closeAnonymousChatSocket() {
  const closeVersion = ++lifecycleVersion;
  const socketClient = client;

  if (socketClient) {
    await socketClient.deactivate();
  }

  // React 개발 모드의 재마운트처럼 종료 중 새 연결 요청이 들어오면 새 생명주기를 유지함
  if (closeVersion !== lifecycleVersion) return;

  hasConnected = false;
  listeners.clear();
  useAnonymousChatStore.getState().setConnectionStatus("disconnected");
}
