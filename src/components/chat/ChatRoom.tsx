// AI 대화 메시지 상태와 입력창을 연결하는 대화방 컴포넌트

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import AiConversationExpiredModal from "@/components/chat/AiConversationExpiredModal";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageList from "@/components/chat/ChatMessageList";
import {
  chatRoomReducer,
  createChatRoomState,
  toChatMessage,
} from "@/components/chat/chatRoomReducer";
import PreferenceAnalysisLoadingModal from "@/components/chat/PreferenceAnalysisLoadingModal";
import PreferenceAnalysisResultModal from "@/components/chat/PreferenceAnalysisResultModal";
import PreferenceAnalysisTimeoutModal from "@/components/chat/PreferenceAnalysisTimeoutModal";
import PreferenceDataInsufficientModal from "@/components/chat/PreferenceDataInsufficientModal";
import ActionButton from "@/components/common/ActionButton";
import AutoFitSingleLineText from "@/components/common/AutoFitSingleLineText";
import useAiConversationStart from "@/hooks/useAiConversationStart";
import useAiConversationStream from "@/hooks/useAiConversationStream";
import {
  confirmAiPreferenceAnalysis,
  requestAiPreferenceAnalysis,
  updateAiPreferenceAnalysis,
  type AiPreferenceAnalysisData,
  RequestAiPreferenceAnalysisError,
} from "@/lib/api/aiConversationAnalysis";
import { getAiConversationMessages } from "@/lib/api/aiConversationMessages";
import {
  sendAiConversationMessage,
  type SendAiConversationMessageResult,
} from "@/lib/api/aiConversationMessageSend";
import { ApiRequestError } from "@/lib/api/client";
import type {
  AiConversationCompletedEvent,
  ChatMessage,
  ChatMessageId,
  PreferenceAnalysisResult,
  PreferenceAnalysisStatus,
} from "@/types/chat";

type ChatRoomProps = {
  initialMessages: ChatMessage[];
  initialAnalysisStatus: PreferenceAnalysisStatus;
  analysisResult: PreferenceAnalysisResult;
  isInputLocked?: boolean;
  isReadOnly?: boolean;
  nextConversationAvailableAt?: string;
  conversationId?: number;
  onMessageSent?: (response: AiConversationCompletedEvent) => void;
};

function toPreferenceAnalysisResult(response: AiPreferenceAnalysisData): PreferenceAnalysisResult {
  return {
    interests: response.keywords.interest,
    preferences: response.keywords.taste,
    summary: response.summary,
    correctionAvailable: response.correctionAvailable,
  };
}

function formatRemainingConversationTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}시 ${minutes}분 ${seconds}초`;
}

export default function ChatRoom({
  initialMessages,
  initialAnalysisStatus,
  analysisResult: initialAnalysisResult,
  isInputLocked = false,
  isReadOnly = false,
  nextConversationAvailableAt,
  conversationId,
  onMessageSent,
}: ChatRoomProps) {
  const router = useRouter();
  const [
    { messages, isAwaitingResponse, sendError, turnErrorMessage, turn, needsMessageSync },
    dispatch,
  ] = useReducer(chatRoomReducer, initialMessages, createChatRoomState);
  const [analysisStatus, setAnalysisStatus] = useState(initialAnalysisStatus);
  const [analysisResult, setAnalysisResult] = useState(initialAnalysisResult);
  const [isResponseInputLocked, setIsResponseInputLocked] = useState(false);
  const [isConfirmingAnalysis, setIsConfirmingAnalysis] = useState(false);
  const [isConversationExpired, setIsConversationExpired] = useState(false);
  const [analysisRequestError, setAnalysisRequestError] = useState("");
  const [isRestartRequired, setIsRestartRequired] = useState(false);
  const [hasRequestedNextConversation, setHasRequestedNextConversation] = useState(false);
  const [remainingConversationSeconds, setRemainingConversationSeconds] = useState<number | null>(
    null,
  );
  const messageListRef = useRef<HTMLElement>(null);
  const isInitialRender = useRef(true);
  const isAnalysisRequestingRef = useRef(false);
  const isMessageSendingRef = useRef(false);
  const isConversationExpiredRef = useRef(false);
  const hasStartedNextConversationRef = useRef(false);
  const {
    errorMessage: conversationStartError,
    isStartingConversation,
    isUnavailable: isConversationStartUnavailable,
    retryAfterSeconds: conversationStartRetryAfterSeconds,
    startConversation,
  } = useAiConversationStart();

  useEffect(() => {
    if (!isReadOnly || !nextConversationAvailableAt) return;

    const availableAt = Date.parse(nextConversationAvailableAt);
    const updateRemainingSeconds = () => {
      const remainingSeconds = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));

      setRemainingConversationSeconds(remainingSeconds);

      if (remainingSeconds === 0) {
        window.clearInterval(intervalTimer);
      }
    };
    const initialTimer = window.setTimeout(updateRemainingSeconds, 0);
    const intervalTimer = window.setInterval(updateRemainingSeconds, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
    };
  }, [isReadOnly, nextConversationAvailableAt]);

  useEffect(() => {
    if (
      !isReadOnly ||
      remainingConversationSeconds !== 0 ||
      hasStartedNextConversationRef.current
    ) {
      return;
    }

    hasStartedNextConversationRef.current = true;
    setHasRequestedNextConversation(true);
    void startConversation({ navigationMode: "replace" });
  }, [isReadOnly, remainingConversationSeconds, startConversation]);

  useEffect(() => {
    if (sendError?.status !== 429 || sendError.retryAfterSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      dispatch({ type: "SEND_ERROR_RETRY_TICKED" });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [sendError]);

  // 생성 중인 대화에 들어오면 메시지 변화 없이 타이핑 표시만 나타나므로 그때도 맨 아래로 스크롤함
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const messageList = messageListRef.current;
    messageList?.scrollTo({ top: messageList.scrollHeight, behavior: "smooth" });
  }, [messages, isAwaitingResponse]);

  // 재연결이나 다른 탭의 턴으로 놓친 메시지를 진행 중인 턴이 없을 때 목록으로 다시 받아옴
  useEffect(() => {
    if (!needsMessageSync || turn !== null || conversationId === undefined) return;

    let isActive = true;

    // TODO: nextCursor와 hasNext를 활용한 대화 메시지 추가 페이지 조회 연동
    getAiConversationMessages({ conversationId, size: 20 })
      .then(({ items }) => {
        if (isActive) {
          dispatch({ type: "MESSAGES_SYNCED", messages: items.map(toChatMessage) });
        }
      })
      .catch((error: unknown) => {
        if (!isActive) return;

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        dispatch({ type: "MESSAGES_SYNC_FAILED" });
      });

    return () => {
      isActive = false;
    };
  }, [conversationId, needsMessageSync, router, turn]);

  const handleAnalysisRequest = useCallback(async () => {
    if (conversationId === undefined || isAnalysisRequestingRef.current) return;

    isAnalysisRequestingRef.current = true;
    setAnalysisRequestError("");
    setAnalysisStatus("LOADING");

    try {
      const response = await requestAiPreferenceAnalysis(conversationId);

      setAnalysisResult(toPreferenceAnalysisResult(response));
      setAnalysisStatus("COMPLETED");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          router.replace("/login");
          return;
        }

        if (error instanceof RequestAiPreferenceAnalysisError && error.status === 409) {
          setAnalysisStatus("IDLE");

          if (error.restartRequired) {
            setIsRestartRequired(true);
            return;
          }

          setAnalysisRequestError(error.message);
          return;
        }

        if (error.status === 429 || error.status === 503) {
          setAnalysisStatus("TIMEOUT");
          return;
        }

        router.replace("/error");
        return;
      }

      if (error instanceof TypeError) {
        setAnalysisStatus("TIMEOUT");
        return;
      }

      router.replace("/error");
    } finally {
      isAnalysisRequestingRef.current = false;
    }
  }, [conversationId, router]);

  useEffect(() => {
    if (isInputLocked && !isReadOnly && conversationId !== undefined) {
      queueMicrotask(() => {
        void handleAnalysisRequest();
      });
    }
  }, [conversationId, handleAnalysisRequest, isInputLocked, isReadOnly]);

  const canSendMessage = () =>
    conversationId !== undefined &&
    !isReadOnly &&
    !isConversationExpiredRef.current &&
    !isMessageSendingRef.current &&
    isStreamConnected &&
    turn === null;

  const expireConversation = () => {
    isConversationExpiredRef.current = true;
    setIsConversationExpired(true);
    dispatch({ type: "TURN_ABORTED" });
    dispatch({ type: "SEND_ERROR_CLEARED" });
  };

  // 새 메시지와 재전송이 함께 쓰는 전송 요청이며 재전송은 같은 clientMessageId를 사용함
  const submitMessage = async (
    targetConversationId: number,
    clientMessageId: string,
    content: string,
  ) => {
    isMessageSendingRef.current = true;

    let result: SendAiConversationMessageResult;

    try {
      result = await sendAiConversationMessage({
        conversationId: targetConversationId,
        clientMessageId,
        content,
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        dispatch({ type: "TURN_ABORTED" });
        router.replace("/login");
        throw error;
      }

      if (error instanceof ApiRequestError && error.status === 410) {
        expireConversation();
        throw error;
      }

      dispatch({
        type: "SEND_FAILED",
        clientMessageId,
        status: error instanceof ApiRequestError ? error.status : 0,
        retryAfterSeconds:
          error instanceof ApiRequestError && error.status === 429
            ? (error.retryAfterSeconds ?? 0)
            : 0,
      });

      throw error;
    } finally {
      isMessageSendingRef.current = false;
    }

    dispatch({ type: "SEND_ACCEPTED", clientMessageId, userMessageId: result.data.userMessageId });

    // 이미 답변이 완료된 메시지를 재전송한 경우라 스트림 이벤트 없이 턴을 끝냄
    if (result.type === "COMPLETED") {
      handleTurnCompleted(result.data);
      dispatch({ type: "TURN_DONE", userMessageId: result.data.userMessageId });
    }
  };

  const handleSend = async (content: string) => {
    if (conversationId === undefined || !canSendMessage()) return;

    const clientMessageId = crypto.randomUUID();

    dispatch({ type: "SEND_STARTED", clientMessageId, content });
    await submitMessage(conversationId, clientMessageId, content);
  };

  const handleTurnCompleted = (event: AiConversationCompletedEvent) => {
    dispatch({
      type: "TURN_COMPLETED",
      userMessageId: event.userMessageId,
      messageId: event.messageId,
      content: event.content,
    });

    if (event.inputLocked) {
      setIsResponseInputLocked(true);
      void handleAnalysisRequest();
    } else {
      setIsResponseInputLocked(false);
    }

    onMessageSent?.(event);
  };

  // 스트림은 ACTIVE 대화에서만 열리며 입력이 잠기거나 만료되면 닫힘
  const { status: streamStatus } = useAiConversationStream({
    conversationId:
      isReadOnly || isInputLocked || isResponseInputLocked || isConversationExpired
        ? undefined
        : conversationId,
    onConnected: ({ generating, pendingUserMessageId }, isReconnected) => {
      dispatch({ type: "STREAM_CONNECTED", generating, pendingUserMessageId, isReconnected });
    },
    onAccepted: ({ clientMessageId, userMessageId }) => {
      dispatch({ type: "SEND_ACCEPTED", clientMessageId, userMessageId });
    },
    onDelta: ({ userMessageId, index, text }) => {
      dispatch({ type: "DELTA_RECEIVED", userMessageId, index, text });
    },
    onCompleted: handleTurnCompleted,
    onError: ({ userMessageId, message, retryable, restartRequired }) => {
      // AI 세션이 사라진 대화라 어느 탭의 턴이든 새 대화 시작으로 안내함
      if (restartRequired) {
        expireConversation();
        return;
      }

      dispatch({ type: "TURN_FAILED", userMessageId, message, retryable });
    },
    onDone: ({ userMessageId }) => {
      dispatch({ type: "TURN_DONE", userMessageId });
    },
  });
  const isStreamConnected = streamStatus === "connected";

  const handleRetryMessage = async (messageId: ChatMessageId) => {
    const failedMessage = messages.find(
      (message) => message.id === messageId && message.deliveryStatus === "FAILED",
    );

    if (conversationId === undefined || !failedMessage?.clientMessageId || !canSendMessage()) {
      return;
    }

    dispatch({ type: "RETRY_STARTED", clientMessageId: failedMessage.clientMessageId });

    try {
      await submitMessage(conversationId, failedMessage.clientMessageId, failedMessage.content);
    } catch {
      // 실패 상태와 재전송 버튼은 submitMessage에서 다시 표시함
    }
  };

  // 메시지 전송 취소 API가 없어 화면에서만 취소 상태로 표시함
  const handleCancelMessage = (messageId: ChatMessageId) => {
    dispatch({ type: "MESSAGE_CANCELED", messageId });
  };

  const handleReturnToChat = () => {
    setAnalysisStatus("IDLE");
  };

  const handleRetryAnalysis = () => {
    void handleAnalysisRequest();
  };

  const handleUpdateAnalysis = async ({
    summary,
    preferences,
    interests,
  }: {
    summary: string;
    preferences: PreferenceAnalysisResult["preferences"];
    interests: PreferenceAnalysisResult["interests"];
  }) => {
    if (conversationId === undefined) {
      throw new Error("AI 대화 ID를 확인할 수 없습니다.");
    }

    try {
      const response = await updateAiPreferenceAnalysis({
        conversationId,
        summary,
        keywords: {
          taste: preferences.map(({ value }) => value),
          interest: interests.map(({ value }) => value),
        },
      });
      const updatedResult = toPreferenceAnalysisResult(response);

      setAnalysisResult(updatedResult);
      return updatedResult;
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          router.replace("/login");
          throw error;
        }

        if (error.status === 403 || error.status === 404 || error.status === 500) {
          router.replace("/error");
          throw error;
        }

        if (
          error.status === 400 ||
          error.status === 422 ||
          error.status === 429 ||
          error.status === 503
        ) {
          throw error;
        }

        router.replace("/error");
        throw error;
      }

      if (error instanceof TypeError) {
        throw new Error("네트워크 연결을 확인한 후 다시 시도해 주세요.");
      }

      router.replace("/error");
      throw error;
    }
  };

  const handleRejectAnalysis = () => {
    setAnalysisStatus("IDLE");
  };

  const handleConfirmAnalysis = async () => {
    if (conversationId === undefined || isConfirmingAnalysis) return;

    setIsConfirmingAnalysis(true);

    let response;

    try {
      response = await confirmAiPreferenceAnalysis(conversationId);
    } catch (error) {
      setIsConfirmingAnalysis(false);

      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          router.replace("/login");
          return;
        }

        if (error.status === 429 || error.status === 503) {
          throw error;
        }

        router.replace("/error");
        return;
      }

      if (error instanceof TypeError) {
        throw new Error("네트워크 연결을 확인한 후 다시 시도해 주세요.");
      }

      router.replace("/error");
      return;
    }

    if (!response.isRecommendationCompleted) {
      setIsConfirmingAnalysis(false);
      throw new Error("추천 생성이 완료되지 않았습니다. 다시 시도해 주세요.");
    }

    router.replace("/");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[max(calc(var(--spacing-page)*1.5),env(safe-area-inset-bottom))]">
      <ChatMessageList
        ref={messageListRef}
        messages={messages}
        isAwaitingResponse={isAwaitingResponse}
        onRetryMessage={(messageId) => void handleRetryMessage(messageId)}
        onCancelMessage={handleCancelMessage}
      />
      {analysisStatus === "IDLE" && (isInputLocked || isResponseInputLocked) && (
        <ActionButton onClick={handleRetryAnalysis} className="mb-3 font-bold">
          분석 결과 다시 보기
        </ActionButton>
      )}
      {isReadOnly && remainingConversationSeconds !== null && remainingConversationSeconds > 0 && (
        <p role="status" className="mb-2 text-center text-body-sm text-danger">
          {formatRemainingConversationTime(remainingConversationSeconds)} 이후 채팅이 가능합니다.
        </p>
      )}
      {isReadOnly && remainingConversationSeconds === 0 && hasRequestedNextConversation && (
        <div className="mb-3 flex flex-col items-center gap-2">
          {conversationStartError && (
            <AutoFitSingleLineText
              role="alert"
              className="w-full min-w-0 text-center text-body-sm text-danger"
            >
              {conversationStartError}
            </AutoFitSingleLineText>
          )}
          <ActionButton
            onClick={() => void startConversation({ navigationMode: "replace" })}
            disabled={isConversationStartUnavailable}
            aria-busy={isStartingConversation || undefined}
            className="font-bold"
          >
            {isStartingConversation
              ? "새로운 대화 시작 중..."
              : conversationStartRetryAfterSeconds > 0
                ? `${conversationStartRetryAfterSeconds}초 후 다시 시도`
                : "새로운 대화 다시 시작"}
          </ActionButton>
        </div>
      )}
      {analysisRequestError && (
        <AutoFitSingleLineText
          role="alert"
          className="mb-2 w-full min-w-0 text-center text-body-sm text-danger"
        >
          {analysisRequestError}
        </AutoFitSingleLineText>
      )}
      {turnErrorMessage && (
        <AutoFitSingleLineText
          role="alert"
          className="mb-2 w-full min-w-0 text-center text-body-sm text-danger"
        >
          {turnErrorMessage}
        </AutoFitSingleLineText>
      )}
      <ChatComposer
        onSend={handleSend}
        placeholder={isReadOnly ? "취향분석이 완료된 대화예요" : "메시지 입력"}
        isDisabled={
          isInputLocked ||
          isResponseInputLocked ||
          isReadOnly ||
          isConversationExpired ||
          conversationId === undefined ||
          !isStreamConnected ||
          turn !== null ||
          (sendError?.status === 429 && sendError.retryAfterSeconds > 0)
        }
      />
      <PreferenceAnalysisLoadingModal open={analysisStatus === "LOADING" || isConfirmingAnalysis} />
      <AiConversationExpiredModal
        open={isConversationExpired}
        onStartNewConversation={() => void startConversation({ navigationMode: "replace" })}
        isStartingConversation={isStartingConversation}
        isStartUnavailable={isConversationStartUnavailable}
        retryAfterSeconds={conversationStartRetryAfterSeconds}
        errorMessage={conversationStartError}
      />
      <PreferenceDataInsufficientModal
        open={isRestartRequired}
        onStartNewConversation={() => void startConversation()}
        isStartingConversation={isStartingConversation}
        isStartUnavailable={isConversationStartUnavailable}
        retryAfterSeconds={conversationStartRetryAfterSeconds}
        errorMessage={conversationStartError}
      />
      <PreferenceAnalysisTimeoutModal
        open={analysisStatus === "TIMEOUT"}
        onReturnToChat={handleReturnToChat}
        onRetryAnalysis={handleRetryAnalysis}
      />
      {analysisStatus === "COMPLETED" && (
        <PreferenceAnalysisResultModal
          open={!isConfirmingAnalysis}
          result={analysisResult}
          onReject={handleRejectAnalysis}
          onConfirm={handleConfirmAnalysis}
          onUpdateAnalysis={handleUpdateAnalysis}
          isConfirming={isConfirmingAnalysis}
        />
      )}
    </div>
  );
}
