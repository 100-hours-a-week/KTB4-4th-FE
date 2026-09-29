// AI 대화 메시지 상태와 입력창을 연결하는 대화방 컴포넌트

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageList from "@/components/chat/ChatMessageList";
import PreferenceAnalysisLoadingModal from "@/components/chat/PreferenceAnalysisLoadingModal";
import PreferenceAnalysisResultModal from "@/components/chat/PreferenceAnalysisResultModal";
import PreferenceAnalysisTimeoutModal from "@/components/chat/PreferenceAnalysisTimeoutModal";
import PreferenceDataInsufficientModal from "@/components/chat/PreferenceDataInsufficientModal";
import ActionButton from "@/components/common/ActionButton";
import useAiConversationStart from "@/hooks/useAiConversationStart";
import {
  confirmAiPreferenceAnalysis,
  requestAiPreferenceAnalysis,
  updateAiPreferenceAnalysis,
  type AiPreferenceAnalysisData,
} from "@/lib/api/aiConversationAnalysis";
import {
  sendAiConversationMessage,
  type SendAiConversationMessageData,
  SendAiConversationMessageError,
} from "@/lib/api/aiConversationMessageSend";
import { ApiRequestError } from "@/lib/api/client";
import type { ChatMessage, PreferenceAnalysisResult, PreferenceAnalysisStatus } from "@/types/chat";

type ChatRoomProps = {
  initialMessages: ChatMessage[];
  initialAnalysisStatus: PreferenceAnalysisStatus;
  analysisResult: PreferenceAnalysisResult;
  isInputLocked?: boolean;
  isReadOnly?: boolean;
  nextConversationAvailableAt?: string;
  conversationId?: number;
  onMessageSent?: (response: SendAiConversationMessageData) => void;
};

type PendingMessage = {
  clientMessageId: string;
  content: string;
};

type MessageSendError = {
  message: string;
  status: number;
  retryAfterSeconds: number;
};

const MIN_AI_RESPONSE_DELAY_MS = 600;

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

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
  const [messages, setMessages] = useState(initialMessages);
  const [analysisStatus, setAnalysisStatus] = useState(initialAnalysisStatus);
  const [analysisResult, setAnalysisResult] = useState(initialAnalysisResult);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [isResponseInputLocked, setIsResponseInputLocked] = useState(false);
  const [isConfirmingAnalysis, setIsConfirmingAnalysis] = useState(false);
  const [sendError, setSendError] = useState<MessageSendError | null>(null);
  const [isRestartRequired, setIsRestartRequired] = useState(false);
  const [remainingConversationSeconds, setRemainingConversationSeconds] = useState<number | null>(
    null,
  );
  const messageListRef = useRef<HTMLElement>(null);
  const isInitialRender = useRef(true);
  const isAnalysisRequestingRef = useRef(false);
  const pendingMessageRef = useRef<PendingMessage | null>(null);
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
      setRemainingConversationSeconds(Math.max(0, Math.ceil((availableAt - Date.now()) / 1000)));
    };
    const initialTimer = window.setTimeout(updateRemainingSeconds, 0);
    const intervalTimer = window.setInterval(updateRemainingSeconds, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
    };
  }, [isReadOnly, nextConversationAvailableAt]);

  useEffect(() => {
    if (sendError?.status !== 429 || sendError.retryAfterSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setSendError((error) =>
        error?.status === 429
          ? { ...error, retryAfterSeconds: Math.max(0, error.retryAfterSeconds - 1) }
          : error,
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [sendError]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const messageList = messageListRef.current;
    messageList?.scrollTo({ top: messageList.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleAnalysisRequest = useCallback(async () => {
    if (conversationId === undefined || isAnalysisRequestingRef.current) return;

    isAnalysisRequestingRef.current = true;
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

  const handleSend = async (content: string) => {
    if (conversationId === undefined || isReadOnly) return;

    const pendingMessage =
      pendingMessageRef.current?.content === content
        ? pendingMessageRef.current
        : { clientMessageId: crypto.randomUUID(), content };
    pendingMessageRef.current = pendingMessage;

    const optimisticUserMessage: ChatMessage = {
      id: pendingMessage.clientMessageId,
      role: "USER",
      senderName: "나",
      content: pendingMessage.content,
    };

    setMessages((currentMessages) => [...currentMessages, optimisticUserMessage]);
    setIsAwaitingResponse(true);

    let response: SendAiConversationMessageData;

    try {
      [response] = await Promise.all([
        sendAiConversationMessage({
          conversationId,
          clientMessageId: pendingMessage.clientMessageId,
          content: pendingMessage.content,
        }),
        delay(MIN_AI_RESPONSE_DELAY_MS),
      ]);
    } catch (error) {
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== pendingMessage.clientMessageId),
      );

      const isNetworkError = error instanceof TypeError;

      if (!isNetworkError) {
        pendingMessageRef.current = null;
      }

      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        throw error;
      }

      if (
        error instanceof SendAiConversationMessageError &&
        error.status === 409 &&
        error.restartRequired
      ) {
        setSendError(null);
        setIsRestartRequired(true);
        return;
      }

      setSendError({
        message: error instanceof ApiRequestError ? error.message : "메시지를 전송하지 못했습니다.",
        status: error instanceof ApiRequestError ? error.status : 0,
        retryAfterSeconds:
          error instanceof ApiRequestError && error.status === 429
            ? (error.retryAfterSeconds ?? 0)
            : 0,
      });

      throw error;
    } finally {
      setIsAwaitingResponse(false);
    }

    const assistantMessage: ChatMessage = {
      id: response.messageId,
      role: "ASSISTANT",
      senderName: "니쥬",
      content: response.content,
    };

    setMessages((currentMessages) => [
      ...currentMessages.map((message) =>
        message.id === pendingMessage.clientMessageId
          ? { ...message, id: response.userMessageId }
          : message,
      ),
      assistantMessage,
    ]);
    pendingMessageRef.current = null;
    setSendError(null);

    if (response.inputLocked) {
      setIsResponseInputLocked(true);
      void handleAnalysisRequest();
    } else {
      setIsResponseInputLocked(false);
    }

    onMessageSent?.(response);
  };

  const handleReturnToChat = () => {
    setAnalysisStatus("IDLE");
  };

  const handleRetryAnalysis = () => {
    void handleAnalysisRequest();
  };

  const handleUpdateAnalysisSummary = async (summary: string) => {
    if (conversationId === undefined) {
      throw new Error("AI 대화 ID를 확인할 수 없습니다.");
    }

    try {
      const response = await updateAiPreferenceAnalysis({
        conversationId,
        summary,
        keywords: {
          // TODO: 취향 분석 키워드 수정 API 연동 범위 확정 후 변경된 키워드 전송
          taste: analysisResult.preferences.map(({ value }) => value),
          interest: analysisResult.interests.map(({ value }) => value),
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
      />
      {sendError && (
        <p role="alert" className="mb-2 text-center text-body-sm text-danger">
          {sendError.message}
          {sendError.status === 429 && sendError.retryAfterSeconds > 0
            ? ` (${sendError.retryAfterSeconds}초 후 다시 전송할 수 있어요.)`
            : ""}
        </p>
      )}
      {analysisStatus === "IDLE" && (isInputLocked || isResponseInputLocked) && (
        <ActionButton onClick={handleRetryAnalysis} className="mb-3 font-bold">
          분석 결과 다시 보기
        </ActionButton>
      )}
      {isReadOnly && remainingConversationSeconds !== null && (
        <p role="status" className="mb-2 text-center text-body-sm text-danger">
          {formatRemainingConversationTime(remainingConversationSeconds)} 이후 채팅이 가능합니다.
        </p>
      )}
      <ChatComposer
        onSend={handleSend}
        placeholder={isReadOnly ? "취향분석이 완료된 대화예요" : "메시지 입력"}
        isDisabled={
          isInputLocked ||
          isResponseInputLocked ||
          isReadOnly ||
          conversationId === undefined ||
          (sendError?.status === 429 && sendError.retryAfterSeconds > 0)
        }
      />
      <PreferenceAnalysisLoadingModal open={analysisStatus === "LOADING" || isConfirmingAnalysis} />
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
          onUpdateSummary={handleUpdateAnalysisSummary}
          isConfirming={isConfirmingAnalysis}
        />
      )}
    </div>
  );
}
