// 채팅방 정보를 조회해 헤더·안내 카드·상품 카드·메시지 목록·입력창을 조립하는 클라이언트 화면
"use client";

import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import AnonymousChatComposer from "@/components/anonymousChat/AnonymousChatComposer";
import AnonymousChatGuideCard from "@/components/anonymousChat/AnonymousChatGuideCard";
import AnonymousChatLeaveModal from "@/components/anonymousChat/AnonymousChatLeaveModal";
import AnonymousChatMessageList from "@/components/anonymousChat/AnonymousChatMessageList";
import AnonymousChatProductCard from "@/components/anonymousChat/AnonymousChatProductCard";
import AnonymousChatReportModal from "@/components/anonymousChat/AnonymousChatReportModal";
import AnonymousChatRoomHeader from "@/components/anonymousChat/AnonymousChatRoomHeader";
import AnonymousChatStartGuide from "@/components/anonymousChat/AnonymousChatStartGuide";
import { useToastContext } from "@/contexts/ToastContext";
import useVisualViewportHeight from "@/hooks/useVisualViewportHeight";
import { getAnonymousChatListHref } from "@/lib/anonymousChatNavigation";
import {
  getAnonymousChatRoomInfo,
  getAnonymousChatRoomMessages,
  isAnonymousChatRoomClosed,
  markAnonymousChatMessagesRead,
  type AnonymousChatMessage,
  type AnonymousChatRoom,
} from "@/lib/api/anonymousChatRoom";
import { ApiRequestError } from "@/lib/api/client";
import {
  addAnonymousChatEventHandler,
  type AnonymousChatEvent,
} from "@/lib/websocket/anonymousChatEvents";
import { retryAnonymousChatMessage } from "@/lib/websocket/anonymousChatMessageDelivery";
import { addAnonymousChatSocketListener } from "@/lib/websocket/anonymousChatSocket";
import { useAnonymousChatPendingMessageStore } from "@/stores/anonymousChatPendingMessageStore";
import { useAnonymousChatStore } from "@/stores/anonymousChatStore";

type AnonymousChatRoomContentProps = {
  chatId: number;
};

type RoomState =
  | { status: "loading" }
  | {
      status: "failed";
      message: string;
      retryAfterSeconds: number;
      canRetry: boolean;
    }
  | { status: "notFound" }
  | { status: "loaded"; room: AnonymousChatRoom };

type PreviousMessagesError = {
  message: string;
  retryAfterSeconds: number;
  canRetry: boolean;
};

const ONBOARDING_REQUIRED_MESSAGE = "온보딩 진행이 필요합니다.";
const MAX_READ_RETRY_ATTEMPTS = 3;
const READ_RETRY_BASE_DELAY_MS = 1_000;
const READ_RETRY_MAX_DELAY_MS = 8_000;
const READ_DEBOUNCE_DELAY_MS = 300;
const MAX_RECONNECT_RECOVERY_RETRY_ATTEMPTS = 3;
const RECONNECT_RECOVERY_RETRY_BASE_DELAY_MS = 1_000;
const RECONNECT_RECOVERY_RETRY_MAX_DELAY_MS = 4_000;
const RECONNECT_RECOVERY_FAILED_MESSAGE =
  "연결은 복구됐지만 누락된 메시지를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.";

function getReconnectRecoveryRetryDelay(error: unknown, retryAttempt: number) {
  if (
    !(error instanceof ApiRequestError) ||
    retryAttempt >= MAX_RECONNECT_RECOVERY_RETRY_ATTEMPTS
  ) {
    return null;
  }

  if (error.status === 429) {
    return Math.max(
      0,
      (error.retryAfterSeconds ?? RECONNECT_RECOVERY_RETRY_BASE_DELAY_MS / 1_000) * 1_000,
    );
  }

  if (error.status !== 500 && error.status !== 503) return null;

  return Math.min(
    RECONNECT_RECOVERY_RETRY_BASE_DELAY_MS * 2 ** retryAttempt,
    RECONNECT_RECOVERY_RETRY_MAX_DELAY_MS,
  );
}

function getStoredMessages(roomId: number) {
  const state = useAnonymousChatStore.getState();

  return (state.messageIdsByRoomId[roomId] ?? []).flatMap((messageId) => {
    const message = state.messagesById[messageId];

    return message ? [message] : [];
  });
}

function mergeDisplayedMessage(
  messages: AnonymousChatMessage[],
  nextMessage: AnonymousChatMessage,
) {
  const currentIndex = messages.findIndex((message) => message.messageId === nextMessage.messageId);

  if (currentIndex < 0) {
    return [...messages, nextMessage].sort((left, right) => left.messageId - right.messageId);
  }

  return messages.map((message, index) => (index === currentIndex ? nextMessage : message));
}

export default function AnonymousChatRoomContent({ chatId }: AnonymousChatRoomContentProps) {
  const [roomState, setRoomState] = useState<RoomState>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);
  // TODO: TanStack Query 도입 시 메시지 페이지·오류·추가 조회 상태를 useInfiniteQuery로 이전
  const [isLoadingPreviousMessages, setIsLoadingPreviousMessages] = useState(false);
  const [previousMessagesError, setPreviousMessagesError] = useState<PreviousMessagesError | null>(
    null,
  );
  const [openModal, setOpenModal] = useState<"report" | "leave" | null>(null);
  const isLoadingPreviousMessagesRef = useRef(false);
  const previousMessagesControllerRef = useRef<AbortController | null>(null);
  // TODO: TanStack Query 도입 시 읽음 처리 요청과 재시도를 useMutation으로 이전
  const latestVisibleCounterpartMessageIdRef = useRef(0);
  const lastReadMessageIdRef = useRef(0);
  const isMarkingMessagesReadRef = useRef(false);
  const readRetryAttemptRef = useRef(0);
  const readRequestControllerRef = useRef<AbortController | null>(null);
  const readDebounceTimerRef = useRef<number | null>(null);
  const readRetryTimerRef = useRef<number | null>(null);
  const processReadReceiptRef = useRef<() => void>(() => undefined);
  const router = useRouter();
  const { showToast } = useToastContext();
  const pendingMessages = useAnonymousChatPendingMessageStore(
    useShallow((state) =>
      (state.clientMessageIdsByRoomId[chatId] ?? []).flatMap((clientMessageId) => {
        const message = state.messagesByClientMessageId[clientMessageId];

        return message ? [message] : [];
      }),
    ),
  );

  useVisualViewportHeight();

  useEffect(() => {
    const store = useAnonymousChatStore.getState();

    store.setActiveRoomId(chatId);

    return () => {
      const currentStore = useAnonymousChatStore.getState();

      if (currentStore.activeRoomId === chatId) {
        currentStore.setActiveRoomId(null);
      }
    };
  }, [chatId]);

  useEffect(() => {
    const handleEvent = (event: AnonymousChatEvent) => {
      if (
        (event.type === "ANONYMOUS_CHAT_MESSAGE_SENT" ||
          event.type === "ANONYMOUS_CHAT_MESSAGE_RECEIVED") &&
        event.data.roomId === chatId
      ) {
        const message = useAnonymousChatStore.getState().messagesById[event.data.messageId];

        if (!message) return;

        setRoomState((current) =>
          current.status === "loaded"
            ? {
                ...current,
                room: {
                  ...current.room,
                  messages: mergeDisplayedMessage(current.room.messages, message),
                },
              }
            : current,
        );
        return;
      }

      if (event.type === "ANONYMOUS_CHAT_MESSAGE_READ" && event.data.roomId === chatId) {
        setRoomState((current) =>
          current.status === "loaded"
            ? {
                ...current,
                room: {
                  ...current.room,
                  messages: current.room.messages.map((message) =>
                    message.isMine && message.messageId <= event.data.lastReadMessageId
                      ? { ...message, unreadCount: 0 }
                      : message,
                  ),
                },
              }
            : current,
        );
        return;
      }

      if (event.type === "ANONYMOUS_CHAT_ROOM_ENDED" && event.data.roomId === chatId) {
        setRoomState((current) =>
          current.status === "loaded"
            ? {
                ...current,
                room: {
                  ...current.room,
                  roomStatus: event.data.roomStatus,
                  endedReason: event.data.endedReason,
                  endedAt: event.data.endedAt,
                },
              }
            : current,
        );
        return;
      }

      if (
        event.type === "ANONYMOUS_CHAT_ERROR" &&
        event.code === "ANONYMOUS_CHAT_ROOM_ENDED" &&
        event.data?.roomId === chatId
      ) {
        setRoomState((current) =>
          current.status === "loaded"
            ? {
                ...current,
                room: {
                  ...current.room,
                  roomStatus: "ENDED",
                },
              }
            : current,
        );
      }
    };

    return addAnonymousChatEventHandler(handleEvent);
  }, [chatId]);

  useEffect(() => {
    let requestController: AbortController | null = null;
    let retryTimer: number | null = null;
    let recoveryVersion = 0;

    const clearRecovery = () => {
      requestController?.abort();
      requestController = null;

      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const recoverMessages = async (version: number, retryAttempt: number) => {
      const currentRequestController = new AbortController();

      requestController = currentRequestController;

      try {
        const { targetName: _targetName, ...messagePage } = await getAnonymousChatRoomMessages({
          roomId: chatId,
          signal: currentRequestController.signal,
        });

        if (version !== recoveryVersion) return;

        useAnonymousChatStore.getState().mergeRoomMessages(chatId, messagePage, "append");

        setRoomState((current) =>
          current.status === "loaded"
            ? {
                ...current,
                room: {
                  ...current.room,
                  roomStatus: messagePage.roomStatus,
                  endedReason: messagePage.endedReason,
                  endedAt: messagePage.endedAt,
                  messages: getStoredMessages(chatId),
                },
              }
            : current,
        );
      } catch (error) {
        if (
          (error instanceof Error && error.name === "AbortError") ||
          version !== recoveryVersion
        ) {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        if (
          error instanceof ApiRequestError &&
          error.status === 403 &&
          error.message === ONBOARDING_REQUIRED_MESSAGE
        ) {
          router.replace("/onboarding");
          return;
        }

        const retryDelay = getReconnectRecoveryRetryDelay(error, retryAttempt);

        if (retryDelay !== null) {
          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            void recoverMessages(version, retryAttempt + 1);
          }, retryDelay);
          return;
        }

        showToast(RECONNECT_RECOVERY_FAILED_MESSAGE);
      } finally {
        if (requestController === currentRequestController) {
          requestController = null;
        }
      }
    };

    const removeSocketListener = addAnonymousChatSocketListener({
      onConnected: ({ isReconnect }) => {
        if (!isReconnect) return;

        recoveryVersion += 1;
        clearRecovery();
        void recoverMessages(recoveryVersion, 0);
      },
    });

    return () => {
      removeSocketListener();
      recoveryVersion += 1;
      clearRecovery();
    };
  }, [chatId, router, showToast]);

  useEffect(() => {
    const requestController = new AbortController();
    let isActive = true;

    Promise.all([
      getAnonymousChatRoomInfo({ roomId: chatId, signal: requestController.signal }),
      getAnonymousChatRoomMessages({ roomId: chatId, signal: requestController.signal }),
    ])
      .then(([roomInfo, messagePage]) => {
        if (isActive) {
          const { targetName, ...messageHistory } = messagePage;
          const store = useAnonymousChatStore.getState();

          store.mergeRoomInfo(roomInfo);
          store.mergeRoomMessages(chatId, messageHistory);

          setRoomState({
            status: "loaded",
            room: {
              ...roomInfo,
              ...messageHistory,
              counterpartName: targetName,
              messages: getStoredMessages(chatId),
            },
          });
        }
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof Error && error.name === "AbortError")) {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        if (
          error instanceof ApiRequestError &&
          error.status === 403 &&
          error.message === ONBOARDING_REQUIRED_MESSAGE
        ) {
          router.replace("/onboarding");
          return;
        }

        if (error instanceof ApiRequestError && error.status === 404) {
          setRoomState({ status: "notFound" });
          return;
        }

        setRoomState({
          status: "failed",
          message:
            error instanceof ApiRequestError
              ? error.message
              : "대화방 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          retryAfterSeconds:
            error instanceof ApiRequestError && error.status === 429
              ? (error.retryAfterSeconds ?? 0)
              : 0,
          canRetry:
            !(error instanceof ApiRequestError) ||
            error.status === 429 ||
            error.status === 500 ||
            error.status === 503,
        });
      });

    return () => {
      isActive = false;
      requestController.abort();
    };
  }, [chatId, requestVersion, router]);

  useEffect(() => {
    return () => {
      previousMessagesControllerRef.current?.abort();
      previousMessagesControllerRef.current = null;
      isLoadingPreviousMessagesRef.current = false;
      readRequestControllerRef.current?.abort();
      readRequestControllerRef.current = null;
      isMarkingMessagesReadRef.current = false;

      if (readDebounceTimerRef.current) {
        window.clearTimeout(readDebounceTimerRef.current);
        readDebounceTimerRef.current = null;
      }

      if (readRetryTimerRef.current) {
        window.clearTimeout(readRetryTimerRef.current);
        readRetryTimerRef.current = null;
      }
    };
  }, []);

  const failedRetryAfterSeconds = roomState.status === "failed" ? roomState.retryAfterSeconds : 0;

  useEffect(() => {
    if (failedRetryAfterSeconds <= 0) {
      return;
    }

    const retryTimer = window.setInterval(() => {
      setRoomState((current) =>
        current.status === "failed"
          ? {
              ...current,
              retryAfterSeconds: Math.max(0, current.retryAfterSeconds - 1),
            }
          : current,
      );
    }, 1_000);

    return () => window.clearInterval(retryTimer);
  }, [failedRetryAfterSeconds]);

  const previousMessagesRetryAfterSeconds = previousMessagesError?.retryAfterSeconds ?? 0;

  useEffect(() => {
    if (previousMessagesRetryAfterSeconds <= 0) {
      return;
    }

    const retryTimer = window.setInterval(() => {
      setPreviousMessagesError((current) =>
        current
          ? {
              ...current,
              retryAfterSeconds: Math.max(0, current.retryAfterSeconds - 1),
            }
          : current,
      );
    }, 1_000);

    return () => window.clearInterval(retryTimer);
  }, [previousMessagesRetryAfterSeconds]);

  const loadPreviousMessages = useCallback(async () => {
    if (
      roomState.status !== "loaded" ||
      !roomState.room.hasNext ||
      !roomState.room.nextCursor ||
      isLoadingPreviousMessagesRef.current
    ) {
      return;
    }

    const requestController = new AbortController();

    previousMessagesControllerRef.current?.abort();
    previousMessagesControllerRef.current = requestController;
    isLoadingPreviousMessagesRef.current = true;
    setIsLoadingPreviousMessages(true);
    setPreviousMessagesError(null);

    try {
      const page = await getAnonymousChatRoomMessages({
        roomId: chatId,
        cursor: roomState.room.nextCursor,
        signal: requestController.signal,
      });

      if (previousMessagesControllerRef.current !== requestController) {
        return;
      }

      useAnonymousChatStore.getState().mergeRoomMessages(chatId, page, "prepend");

      setRoomState((current) => {
        if (current.status !== "loaded") {
          return current;
        }

        const currentMessageIds = new Set(
          current.room.messages.map((message) => message.messageId),
        );
        const previousMessages = page.messages.filter(
          (message) => !currentMessageIds.has(message.messageId),
        );

        return {
          status: "loaded",
          room: {
            ...current.room,
            counterpartName: page.targetName,
            roomStatus: page.roomStatus,
            endedReason: page.endedReason,
            endedAt: page.endedAt,
            messages: [...previousMessages, ...current.room.messages],
            nextCursor: page.nextCursor,
            hasNext: page.hasNext,
          },
        };
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      if (
        error instanceof ApiRequestError &&
        error.status === 403 &&
        error.message === ONBOARDING_REQUIRED_MESSAGE
      ) {
        router.replace("/onboarding");
        return;
      }

      if (error instanceof ApiRequestError && error.status === 404) {
        setRoomState({ status: "notFound" });
        return;
      }

      setPreviousMessagesError({
        message:
          error instanceof ApiRequestError
            ? error.message
            : "이전 메시지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        retryAfterSeconds:
          error instanceof ApiRequestError && error.status === 429
            ? (error.retryAfterSeconds ?? 0)
            : 0,
        canRetry:
          !(error instanceof ApiRequestError) ||
          error.status === 429 ||
          error.status === 500 ||
          error.status === 503,
      });
    } finally {
      if (previousMessagesControllerRef.current === requestController) {
        previousMessagesControllerRef.current = null;
        isLoadingPreviousMessagesRef.current = false;
        setIsLoadingPreviousMessages(false);
      }
    }
  }, [chatId, roomState, router]);

  const processReadReceipt = useCallback(async () => {
    if (isMarkingMessagesReadRef.current || readRetryTimerRef.current) {
      return;
    }

    const lastReadMessageId = latestVisibleCounterpartMessageIdRef.current;

    if (lastReadMessageId <= lastReadMessageIdRef.current) {
      return;
    }

    const requestController = new AbortController();
    let shouldProcessNextMessage = false;

    readRequestControllerRef.current?.abort();
    readRequestControllerRef.current = requestController;
    isMarkingMessagesReadRef.current = true;

    try {
      await markAnonymousChatMessagesRead({
        roomId: chatId,
        lastReadMessageId,
        signal: requestController.signal,
      });

      if (readRequestControllerRef.current !== requestController) {
        return;
      }

      lastReadMessageIdRef.current = Math.max(lastReadMessageIdRef.current, lastReadMessageId);
      useAnonymousChatStore.getState().acknowledgeRoomRead(chatId, lastReadMessageId);
      readRetryAttemptRef.current = 0;
      shouldProcessNextMessage =
        latestVisibleCounterpartMessageIdRef.current > lastReadMessageIdRef.current;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      if (
        error instanceof ApiRequestError &&
        error.status === 403 &&
        error.message === ONBOARDING_REQUIRED_MESSAGE
      ) {
        router.replace("/onboarding");
        return;
      }

      if (error instanceof ApiRequestError && error.status === 404) {
        setRoomState({ status: "notFound" });
        return;
      }

      if (error instanceof ApiRequestError && error.status === 403) {
        setRoomState({
          status: "failed",
          message: error.message,
          retryAfterSeconds: 0,
          canRetry: false,
        });
        return;
      }

      const isRetryableError =
        error instanceof ApiRequestError &&
        (error.status === 429 || error.status === 500 || error.status === 503);

      if (isRetryableError && readRetryAttemptRef.current < MAX_READ_RETRY_ATTEMPTS) {
        readRetryAttemptRef.current += 1;

        const retryDelay =
          error.status === 429
            ? (error.retryAfterSeconds ?? 1) * 1_000
            : Math.min(
                READ_RETRY_BASE_DELAY_MS * 2 ** (readRetryAttemptRef.current - 1),
                READ_RETRY_MAX_DELAY_MS,
              );

        readRetryTimerRef.current = window.setTimeout(() => {
          readRetryTimerRef.current = null;
          void processReadReceiptRef.current();
        }, retryDelay);
      }
    } finally {
      if (readRequestControllerRef.current === requestController) {
        readRequestControllerRef.current = null;
        isMarkingMessagesReadRef.current = false;
      }

      if (shouldProcessNextMessage) {
        window.queueMicrotask(() => processReadReceiptRef.current());
      }
    }
  }, [chatId, router]);

  useEffect(() => {
    processReadReceiptRef.current = () => {
      void processReadReceipt();
    };
  }, [processReadReceipt]);

  const handleLastVisibleCounterpartMessageChange = useCallback((messageId: number) => {
    if (messageId <= latestVisibleCounterpartMessageIdRef.current) {
      return;
    }

    latestVisibleCounterpartMessageIdRef.current = messageId;
    readRetryAttemptRef.current = 0;

    if (readRetryTimerRef.current) {
      window.clearTimeout(readRetryTimerRef.current);
      readRetryTimerRef.current = null;
    }

    if (readDebounceTimerRef.current) {
      window.clearTimeout(readDebounceTimerRef.current);
    }

    readDebounceTimerRef.current = window.setTimeout(() => {
      readDebounceTimerRef.current = null;
      void processReadReceiptRef.current();
    }, READ_DEBOUNCE_DELAY_MS);
  }, []);

  if (roomState.status === "notFound") {
    notFound();
  }

  const handleRetryMessage = useCallback(
    (clientMessageId: string) => {
      try {
        retryAnonymousChatMessage(clientMessageId);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "메시지를 다시 보내지 못했어요.");
      }
    },
    [showToast],
  );

  const closeModal = () => setOpenModal(null);

  const handleReported = (message = "신고가 접수됐어요.") => {
    setOpenModal(null);
    showToast(message);
  };

  // 나간 채팅방은 더 이상 볼 수 없으므로 대화 목록으로 돌아감
  const handleLeft = (roomId: number) => {
    const listType = roomState.status === "loaded" ? roomState.room.type : "SENT";

    useAnonymousChatStore.getState().removeRoom(roomId);
    useAnonymousChatPendingMessageStore.getState().removePendingMessagesByRoomId(roomId);
    setOpenModal(null);
    showToast("채팅방을 나갔어요.");
    router.replace(getAnonymousChatListHref(listType));
  };

  if (roomState.status !== "loaded") {
    return (
      <main aria-label="대화" className="page-content flex flex-1 flex-col bg-background">
        <p
          role={roomState.status === "failed" ? "alert" : "status"}
          className={`pt-8 text-center text-body-sm ${roomState.status === "failed" ? "text-danger" : "text-muted"}`}
        >
          {roomState.status === "failed" ? roomState.message : "대화를 불러오는 중이에요."}
        </p>
        {roomState.status === "failed" && roomState.canRetry && (
          <button
            type="button"
            disabled={roomState.retryAfterSeconds > 0}
            className="mx-auto mt-2 rounded-sm border border-border-strong bg-surface px-4 py-2 text-body-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              setRoomState({ status: "loading" });
              setRequestVersion((current) => current + 1);
            }}
          >
            {roomState.retryAfterSeconds > 0
              ? `${roomState.retryAfterSeconds}초 후 다시 시도`
              : "다시 시도"}
          </button>
        )}
      </main>
    );
  }

  const { room } = roomState;

  return (
    <main
      aria-label="대화"
      data-scrollbar-gutter="none"
      className="page-content flex min-h-0 flex-1 flex-col bg-background-subtle"
    >
      <div className="-mx-page">
        <AnonymousChatRoomHeader
          counterpartName={room.counterpartName}
          type={room.type}
          listHref={getAnonymousChatListHref(room.type)}
          onReport={() => setOpenModal("report")}
          onLeave={() => setOpenModal("leave")}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-3 pt-4 pb-2">
        <AnonymousChatGuideCard counterpartName={room.counterpartName} type={room.type} />
        <AnonymousChatProductCard product={room.product} />
      </div>

      {room.messages.length > 0 ||
      pendingMessages.length > 0 ||
      room.hasNext ||
      isAnonymousChatRoomClosed(room.roomStatus) ? (
        <AnonymousChatMessageList
          counterpartName={room.counterpartName}
          messages={room.messages}
          pendingMessages={pendingMessages}
          isRoomEnded={isAnonymousChatRoomClosed(room.roomStatus)}
          hasNext={room.hasNext}
          isLoadingPreviousMessages={isLoadingPreviousMessages}
          previousMessagesError={previousMessagesError}
          onLoadPreviousMessages={loadPreviousMessages}
          onLastVisibleCounterpartMessageChange={handleLastVisibleCounterpartMessageChange}
          onRetryMessage={handleRetryMessage}
        />
      ) : (
        <AnonymousChatStartGuide />
      )}

      <AnonymousChatComposer
        chatId={room.roomId}
        isDisabled={isAnonymousChatRoomClosed(room.roomStatus)}
      />

      <AnonymousChatReportModal
        open={openModal === "report"}
        chatId={room.roomId}
        onClose={closeModal}
        onReported={handleReported}
      />
      <AnonymousChatLeaveModal
        chatId={openModal === "leave" ? room.roomId : null}
        onClose={closeModal}
        onLeft={handleLeft}
      />
    </main>
  );
}
