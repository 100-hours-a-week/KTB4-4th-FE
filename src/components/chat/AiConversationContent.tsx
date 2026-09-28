// 검증된 AI 대화 시작 상태에 따라 대화 화면 동작을 제어하는 콘텐츠
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import ChatRoom from "@/components/chat/ChatRoom";
import PreferenceAnalysisBar from "@/components/chat/PreferenceAnalysisBar";
import ActionButton from "@/components/common/ActionButton";
import { useAiConversationContext } from "@/contexts/AiConversationContext";
import {
  getAiConversationMessages,
  type AiConversationMessage,
} from "@/lib/api/aiConversationMessages";
import type { SendAiConversationMessageData } from "@/lib/api/aiConversationMessageSend";
import { startAiConversation } from "@/lib/api/aiConversations";
import { ApiRequestError } from "@/lib/api/client";
import { getPreferenceAnalysisDescription } from "@/mocks/chat";
import type { ChatMessage, PreferenceAnalysisResult } from "@/types/chat";

type AiConversationContentProps = {
  conversationId?: string;
};

type ConversationMessagesState = {
  conversationId: number;
  messages: ChatMessage[];
};

type ConversationMessagesError = {
  conversationId: number;
  message: string;
  status: number;
  retryAfterSeconds: number;
};

const EMPTY_PREFERENCE_ANALYSIS_RESULT: PreferenceAnalysisResult = {
  interests: [],
  preferences: [],
  summary: null,
  correctionAvailable: false,
};

function toChatMessage(message: AiConversationMessage): ChatMessage {
  const isAiMessage = message.role === "AI";

  return {
    id: message.messageId,
    role: isAiMessage ? "ASSISTANT" : "USER",
    senderName: isAiMessage ? "니쥬" : "나",
    content: message.content,
  };
}

export default function AiConversationContent({ conversationId }: AiConversationContentProps) {
  const router = useRouter();
  const { conversation, setConversation } = useAiConversationContext();
  const [messagesState, setMessagesState] = useState<ConversationMessagesState | null>(null);
  const [messagesError, setMessagesError] = useState<ConversationMessagesError | null>(null);
  const [conversationRestoreError, setConversationRestoreError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState<number | null>(null);
  const restoreRequestKeyRef = useRef<string | null>(null);
  const isVerifiedConversation =
    conversation !== null && String(conversation.conversationId) === conversationId;
  const verifiedStatus = isVerifiedConversation ? conversation.status : undefined;
  const availableConversationId =
    verifiedStatus === "ACTIVE" || verifiedStatus === "ANALYZING"
      ? conversation?.conversationId
      : undefined;
  const messages =
    availableConversationId !== undefined &&
    messagesState?.conversationId === availableConversationId
      ? messagesState.messages
      : [];
  const currentError =
    availableConversationId !== undefined &&
    messagesError?.conversationId === availableConversationId
      ? messagesError
      : null;
  const isLoadingMessages =
    availableConversationId !== undefined &&
    messagesState?.conversationId !== availableConversationId &&
    messagesError?.conversationId !== availableConversationId;
  const currentAnalysisProgress =
    analysisProgress ?? (isVerifiedConversation ? conversation.progress : 0);

  useEffect(() => {
    if (isVerifiedConversation) {
      if (conversation.status !== "ACTIVE" && conversation.status !== "ANALYZING") {
        router.replace("/error");
      }
      return;
    }

    const requestKey = conversationId ?? "missing-conversation-id";

    if (restoreRequestKeyRef.current === requestKey) return;

    restoreRequestKeyRef.current = requestKey;
    setConversationRestoreError("");

    void startAiConversation()
      .then((restoredConversation) => {
        if (restoreRequestKeyRef.current !== requestKey) return;

        setConversation(restoredConversation);

        if (
          restoredConversation.status !== "ACTIVE" &&
          restoredConversation.status !== "ANALYZING"
        ) {
          router.replace("/error");
          return;
        }

        if (String(restoredConversation.conversationId) !== conversationId) {
          router.replace(`/ai?conversationId=${restoredConversation.conversationId}`);
        }
      })
      .catch((error: unknown) => {
        if (restoreRequestKeyRef.current !== requestKey) return;

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setConversationRestoreError(
          error instanceof ApiRequestError ? error.message : "AI 대화를 불러오지 못했습니다.",
        );
      });
  }, [conversation, conversationId, isVerifiedConversation, router, setConversation]);

  useEffect(() => {
    if (currentError?.status !== 429 || currentError.retryAfterSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setMessagesError((error) =>
        error?.conversationId === currentError.conversationId
          ? { ...error, retryAfterSeconds: Math.max(0, error.retryAfterSeconds - 1) }
          : error,
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [currentError]);

  useEffect(() => {
    if (availableConversationId === undefined) return;

    let isActive = true;

    // TODO: nextCursor와 hasNext를 활용한 대화 메시지 추가 페이지 조회 연동
    getAiConversationMessages({ conversationId: availableConversationId, size: 20 })
      .then(({ items }) => {
        if (isActive) {
          setMessagesState({
            conversationId: availableConversationId,
            messages: items.map(toChatMessage),
          });
        }
      })
      .catch((error: unknown) => {
        if (!isActive) return;

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setMessagesError({
          conversationId: availableConversationId,
          message:
            error instanceof ApiRequestError ? error.message : "대화 메시지를 불러오지 못했습니다.",
          status: error instanceof ApiRequestError ? error.status : 0,
          retryAfterSeconds:
            error instanceof ApiRequestError && error.status === 429
              ? (error.retryAfterSeconds ?? 0)
              : 0,
        });
      });

    return () => {
      isActive = false;
    };
  }, [availableConversationId, requestVersion, router]);

  const handleRetry = () => {
    setMessagesError(null);
    setRequestVersion((version) => version + 1);
  };

  const handleMessageSent = (response: SendAiConversationMessageData) => {
    setAnalysisProgress(response.progress);

    if (response.inputLocked && conversation !== null) {
      setConversation({ ...conversation, status: "ANALYZING" });
    }
  };

  return (
    <main
      aria-label="AI 대화"
      className="page-content flex min-h-0 flex-1 flex-col bg-background-subtle pt-4"
    >
      {/* TODO: 취향 분석 진행률 설명 API 연동 후 Mock 설명 문구 교체 */}
      <PreferenceAnalysisBar
        progress={currentAnalysisProgress}
        description={getPreferenceAnalysisDescription(currentAnalysisProgress)}
      />

      {!isVerifiedConversation && !conversationRestoreError ? (
        <p
          role="status"
          className="flex min-h-0 flex-1 items-center justify-center text-body-sm text-muted"
        >
          대화를 불러오는 중이에요.
        </p>
      ) : conversationRestoreError ? (
        <p
          role="alert"
          className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-body-sm text-danger"
        >
          {conversationRestoreError}
        </p>
      ) : availableConversationId === undefined ? (
        <p
          role="status"
          className="flex min-h-0 flex-1 items-center justify-center text-body-sm text-muted"
        >
          대화 정보를 확인하는 중이에요.
        </p>
      ) : isLoadingMessages ? (
        <p
          role="status"
          className="flex min-h-0 flex-1 items-center justify-center text-body-sm text-muted"
        >
          대화 메시지를 불러오는 중이에요.
        </p>
      ) : currentError ? (
        <div
          role="alert"
          className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center"
        >
          <p className="text-body-sm text-danger">{currentError.message}</p>
          {currentError.status === 429 && (
            <ActionButton
              onClick={handleRetry}
              disabled={currentError.retryAfterSeconds > 0}
              className="mt-4 max-w-[240px] font-bold"
            >
              {currentError.retryAfterSeconds > 0
                ? `${currentError.retryAfterSeconds}초 후 다시 시도`
                : "다시 시도"}
            </ActionButton>
          )}
        </div>
      ) : (
        <ChatRoom
          key={`conversation-${availableConversationId}`}
          initialMessages={messages}
          initialAnalysisStatus="IDLE"
          analysisResult={EMPTY_PREFERENCE_ANALYSIS_RESULT}
          isInputLocked={verifiedStatus === "ANALYZING"}
          conversationId={availableConversationId}
          onMessageSent={handleMessageSent}
        />
      )}
    </main>
  );
}
