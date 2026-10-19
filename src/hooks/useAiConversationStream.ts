// 대화 화면에 있는 동안 AI 대화 SSE 스트림을 열어 두고 이벤트 전달과 끊김 복구를 관리하는 훅
"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { startAiConversation, type AiConversation } from "@/lib/api/aiConversations";
import { ApiRequestError, redirectToLogin, refreshAccessToken } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AiConversationAcceptedEvent,
  AiConversationCompletedEvent,
  AiConversationConnectedEvent,
  AiConversationDeltaEvent,
  AiConversationDoneEvent,
  AiConversationErrorEvent,
} from "@/types/chat";

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export type AiConversationStreamStatus =
  "idle" | "connecting" | "connected" | "recovering" | "stopped";

// 연결이 닫힌 뒤 대화 시작 API로 다시 확인했을 때 같은 ACTIVE 대화로 재연결할 수 없는 결과
export type AiConversationStreamRecovery =
  | { type: "CONVERSATION_CHANGED"; conversation: AiConversation }
  | { type: "UNAVAILABLE"; error: ApiRequestError };

export interface AiConversationStreamHandlers {
  // isReconnected가 true면 끊긴 사이 완료된 답변을 메시지 목록으로 복구해야 함
  onConnected?: (event: AiConversationConnectedEvent, isReconnected: boolean) => void;
  onAccepted?: (event: AiConversationAcceptedEvent) => void;
  onDelta?: (event: AiConversationDeltaEvent) => void;
  onCompleted?: (event: AiConversationCompletedEvent) => void;
  onError?: (event: AiConversationErrorEvent) => void;
  onDone?: (event: AiConversationDoneEvent) => void;
  onRecovery?: (result: AiConversationStreamRecovery) => void;
}

interface UseAiConversationStreamParams extends AiConversationStreamHandlers {
  // undefined면 스트림을 열지 않음 (ACTIVE가 아닌 대화)
  conversationId?: number;
}

type StreamState = {
  conversationId: number;
  status: AiConversationStreamStatus;
};

function parseEventData<T>(event: MessageEvent<string>) {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

// 일시적인 실패라 같은 대화로 다시 연결을 시도할 오류인지 확인함
function isTemporaryFailure(error: unknown) {
  if (error instanceof TypeError) return true;

  return error instanceof ApiRequestError && (error.status === 429 || error.status >= 500);
}

export default function useAiConversationStream({
  conversationId,
  onConnected,
  onAccepted,
  onDelta,
  onCompleted,
  onError,
  onDone,
  onRecovery,
}: UseAiConversationStreamParams) {
  const [streamState, setStreamState] = useState<StreamState | null>(null);
  const status: AiConversationStreamStatus =
    conversationId === undefined
      ? "idle"
      : streamState?.conversationId === conversationId
        ? streamState.status
        : "connecting";

  const handleConnected = useEffectEvent(
    (event: AiConversationConnectedEvent, isReconnected: boolean) => {
      onConnected?.(event, isReconnected);
    },
  );
  const handleAccepted = useEffectEvent((event: AiConversationAcceptedEvent) => {
    onAccepted?.(event);
  });
  const handleDelta = useEffectEvent((event: AiConversationDeltaEvent) => {
    onDelta?.(event);
  });
  const handleCompleted = useEffectEvent((event: AiConversationCompletedEvent) => {
    onCompleted?.(event);
  });
  const handleError = useEffectEvent((event: AiConversationErrorEvent) => {
    onError?.(event);
  });
  const handleDone = useEffectEvent((event: AiConversationDoneEvent) => {
    onDone?.(event);
  });
  const handleRecovery = useEffectEvent((result: AiConversationStreamRecovery) => {
    onRecovery?.(result);
  });

  useEffect(() => {
    if (conversationId === undefined) return;

    const streamConversationId = conversationId;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let hasConnected = false;
    let isDisposed = false;

    const updateStatus = (nextStatus: AiConversationStreamStatus) => {
      if (!isDisposed) {
        setStreamState({ conversationId: streamConversationId, status: nextStatus });
      }
    };

    const closeEventSource = () => {
      eventSource?.close();
      eventSource = null;
    };

    const stop = () => {
      closeEventSource();
      updateStatus("stopped");
    };

    // 연결 오류로 발생한 error 이벤트는 data가 없어 파싱 결과가 null이므로 전달하지 않음
    const addListener = <T>(eventName: string, listener: (data: T) => void) => {
      eventSource?.addEventListener(eventName, (event) => {
        const data = parseEventData<T>(event as MessageEvent<string>);

        if (data) {
          listener(data);
        }
      });
    };

    const scheduleReconnect = (minimumDelayMs = 0) => {
      const delay = Math.max(
        minimumDelayMs,
        Math.min(INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttempt, MAX_RECONNECT_DELAY_MS),
      );

      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;

        if (!isDisposed) {
          connect();
        }
      }, delay);
    };

    // EventSource는 HTTP 상태 코드를 알 수 없으므로 토큰 재발급 후 대화 시작 API로 대화 상태를 다시 확인함
    const recoverClosedConnection = async () => {
      closeEventSource();
      updateStatus("recovering");

      try {
        await refreshAccessToken();
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          stop();
          redirectToLogin();
          return;
        }
      }

      if (isDisposed) return;

      let conversation: AiConversation;

      try {
        conversation = await startAiConversation();
      } catch (error) {
        if (isDisposed) return;

        if (error instanceof ApiRequestError && error.status === 401) {
          stop();
          redirectToLogin();
          return;
        }

        if (isTemporaryFailure(error)) {
          const retryAfterSeconds =
            error instanceof ApiRequestError ? (error.retryAfterSeconds ?? 0) : 0;

          scheduleReconnect(retryAfterSeconds * 1000);
          return;
        }

        stop();

        if (error instanceof ApiRequestError) {
          handleRecovery({ type: "UNAVAILABLE", error });
        }
        return;
      }

      if (isDisposed) return;

      if (
        conversation.conversationId === streamConversationId &&
        conversation.status === "ACTIVE"
      ) {
        scheduleReconnect();
        return;
      }

      stop();
      handleRecovery({ type: "CONVERSATION_CHANGED", conversation });
    };

    function connect() {
      closeEventSource();
      updateStatus("connecting");

      const source = new EventSource(API_ENDPOINTS.ai.conversationStream(streamConversationId), {
        withCredentials: true,
      });

      eventSource = source;

      addListener<AiConversationConnectedEvent>("connected", (data) => {
        const isReconnected = hasConnected;

        hasConnected = true;
        reconnectAttempt = 0;
        updateStatus("connected");
        handleConnected(data, isReconnected);
      });
      addListener<AiConversationAcceptedEvent>("accepted", handleAccepted);
      addListener<AiConversationDeltaEvent>("delta", handleDelta);
      addListener<AiConversationCompletedEvent>("completed", handleCompleted);
      addListener<AiConversationErrorEvent>("error", handleError);
      addListener<AiConversationDoneEvent>("done", handleDone);

      // 서버의 error 이벤트도 같은 이름이라 onerror가 호출되므로 OPEN 상태면 연결 오류가 아님
      source.onerror = () => {
        if (source !== eventSource || source.readyState === EventSource.OPEN) return;

        // CONNECTING 상태는 브라우저가 자동 재연결 중이므로 connected를 다시 받을 때까지 기다림
        if (source.readyState === EventSource.CONNECTING) {
          updateStatus("connecting");
          return;
        }

        void recoverClosedConnection();
      };
    }

    connect();

    return () => {
      isDisposed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      closeEventSource();
    };
  }, [conversationId]);

  return { status };
}
