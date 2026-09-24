// 검증된 AI 대화 시작 상태에 따라 대화 화면 동작을 제어하는 콘텐츠
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ChatRoom from "@/components/chat/ChatRoom";
import PreferenceAnalysisBar from "@/components/chat/PreferenceAnalysisBar";
import ActionButton from "@/components/common/ActionButton";
import { useAiConversationContext } from "@/contexts/AiConversationContext";
import {
  getAiConversationMessages,
  type AiConversationMessage,
} from "@/lib/api/aiConversationMessages";
import { ApiRequestError } from "@/lib/api/client";
import {
  temporaryChatMessages,
  temporaryPreferenceAnalysis,
  temporaryPreferenceAnalysisResult,
  temporaryPreferenceAnalysisStatus,
} from "@/mocks/chat";
import type { ChatMessage } from "@/types/chat";

type AiConversationContentProps = {
  conversationId?: string;
  status?: string;
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

function toChatMessage(message: AiConversationMessage): ChatMessage {
  const isAiMessage = message.role === "AI";

  return {
    id: message.messageId,
    role: isAiMessage ? "ASSISTANT" : "USER",
    senderName: isAiMessage ? "니쥬" : "나",
    content: message.content,
  };
}

export default function AiConversationContent({
  conversationId,
  status,
}: AiConversationContentProps) {
  const router = useRouter();
  const { conversation } = useAiConversationContext();
  const [messagesState, setMessagesState] = useState<ConversationMessagesState | null>(null);
  const [messagesError, setMessagesError] = useState<ConversationMessagesError | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const isVerifiedConversation =
    conversation !== null &&
    String(conversation.conversationId) === conversationId &&
    conversation.status === status;
  const verifiedStatus = isVerifiedConversation ? conversation.status : undefined;
  const activeConversationId =
    verifiedStatus === "ACTIVE" ? conversation?.conversationId : undefined;
  const messages =
    activeConversationId !== undefined && messagesState?.conversationId === activeConversationId
      ? messagesState.messages
      : temporaryChatMessages;
  const currentError =
    activeConversationId !== undefined && messagesError?.conversationId === activeConversationId
      ? messagesError
      : null;
  const isLoadingMessages =
    activeConversationId !== undefined &&
    messagesState?.conversationId !== activeConversationId &&
    messagesError?.conversationId !== activeConversationId;

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
    if (activeConversationId === undefined) return;

    let isActive = true;

    // TODO: nextCursor와 hasNext를 활용한 대화 메시지 추가 페이지 조회 연동
    getAiConversationMessages({ conversationId: activeConversationId, size: 20 })
      .then(({ items }) => {
        if (isActive) {
          setMessagesState({
            conversationId: activeConversationId,
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
          conversationId: activeConversationId,
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
  }, [activeConversationId, requestVersion, router]);

  const handleRetry = () => {
    setMessagesError(null);
    setRequestVersion((version) => version + 1);
  };

  return (
    <main
      aria-label="AI 대화"
      className="page-content flex min-h-0 flex-1 flex-col bg-background-subtle pt-4"
    >
      {/* TODO: AI 대화 API 응답의 취향 분석 상태로 교체 */}
      <PreferenceAnalysisBar {...temporaryPreferenceAnalysis} />

      {isLoadingMessages ? (
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
        <>
          {/* TODO: AI 대화 API의 취향 분석 상태로 Mock 상태를 교체 */}
          <ChatRoom
            key={
              messages === temporaryChatMessages
                ? "temporary-chat"
                : `conversation-${activeConversationId}`
            }
            initialMessages={messages}
            initialAnalysisStatus={temporaryPreferenceAnalysisStatus}
            analysisResult={temporaryPreferenceAnalysisResult}
            isInputLocked={verifiedStatus === "ANALYZING"}
          />
        </>
      )}
    </main>
  );
}
