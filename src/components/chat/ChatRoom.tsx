// AI 대화 메시지 상태와 입력창을 연결하는 대화방 컴포넌트

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageList from "@/components/chat/ChatMessageList";
import PreferenceAnalysisLoadingModal from "@/components/chat/PreferenceAnalysisLoadingModal";
import PreferenceAnalysisResultModal from "@/components/chat/PreferenceAnalysisResultModal";
import PreferenceAnalysisTimeoutModal from "@/components/chat/PreferenceAnalysisTimeoutModal";
import {
  requestAiPreferenceAnalysis,
  updateAiPreferenceAnalysis,
  type AiPreferenceAnalysisData,
} from "@/lib/api/aiConversationAnalysis";
import {
  sendAiConversationMessage,
  type SendAiConversationMessageData,
} from "@/lib/api/aiConversationMessageSend";
import { ApiRequestError } from "@/lib/api/client";
import type { ChatMessage, PreferenceAnalysisResult, PreferenceAnalysisStatus } from "@/types/chat";

type ChatRoomProps = {
  initialMessages: ChatMessage[];
  initialAnalysisStatus: PreferenceAnalysisStatus;
  analysisResult: PreferenceAnalysisResult;
  isInputLocked?: boolean;
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

function toPreferenceAnalysisResult(response: AiPreferenceAnalysisData): PreferenceAnalysisResult {
  return {
    interests: response.keywords.interest,
    preferences: response.keywords.taste,
    summary: response.summary,
    correctionAvailable: response.correctionAvailable,
  };
}

export default function ChatRoom({
  initialMessages,
  initialAnalysisStatus,
  analysisResult: initialAnalysisResult,
  isInputLocked = false,
  conversationId,
  onMessageSent,
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [analysisStatus, setAnalysisStatus] = useState(initialAnalysisStatus);
  const [analysisResult, setAnalysisResult] = useState(initialAnalysisResult);
  const [isResponseInputLocked, setIsResponseInputLocked] = useState(false);
  const [sendError, setSendError] = useState<MessageSendError | null>(null);
  const messageListRef = useRef<HTMLElement>(null);
  const isInitialRender = useRef(true);
  const pendingMessageRef = useRef<PendingMessage | null>(null);

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

  const handleAnalysisRequest = async () => {
    if (conversationId === undefined) return;

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
    }
  };

  const handleSend = async (content: string) => {
    if (conversationId === undefined) return;

    const pendingMessage =
      pendingMessageRef.current?.content === content
        ? pendingMessageRef.current
        : { clientMessageId: crypto.randomUUID(), content };
    pendingMessageRef.current = pendingMessage;

    let response: SendAiConversationMessageData;

    try {
      response = await sendAiConversationMessage({
        conversationId,
        clientMessageId: pendingMessage.clientMessageId,
        content: pendingMessage.content,
      });
    } catch (error) {
      const isNetworkError = error instanceof TypeError;

      if (!isNetworkError) {
        pendingMessageRef.current = null;
      }

      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        throw error;
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
    }

    const userMessage: ChatMessage = {
      id: response.userMessageId,
      role: "USER",
      senderName: "나",
      content,
    };
    const assistantMessage: ChatMessage = {
      id: response.messageId,
      role: "ASSISTANT",
      senderName: "니쥬",
      content: response.content,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage, assistantMessage]);
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

  const handleConfirmAnalysis = () => {
    // TODO: AI 취향 분석 결과 확인 API 및 다음 화면 이동 동작 연동
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatMessageList ref={messageListRef} messages={messages} />
      {sendError && (
        <p role="alert" className="mb-2 text-center text-body-sm text-danger">
          {sendError.message}
          {sendError.status === 429 && sendError.retryAfterSeconds > 0
            ? ` (${sendError.retryAfterSeconds}초 후 다시 전송할 수 있어요.)`
            : ""}
        </p>
      )}
      <ChatComposer
        onSend={handleSend}
        isDisabled={
          isInputLocked ||
          isResponseInputLocked ||
          conversationId === undefined ||
          (sendError?.status === 429 && sendError.retryAfterSeconds > 0)
        }
      />
      <PreferenceAnalysisLoadingModal open={analysisStatus === "LOADING"} />
      <PreferenceAnalysisTimeoutModal
        open={analysisStatus === "TIMEOUT"}
        onReturnToChat={handleReturnToChat}
        onRetryAnalysis={handleRetryAnalysis}
      />
      {analysisStatus === "COMPLETED" && (
        <PreferenceAnalysisResultModal
          open
          result={analysisResult}
          onReject={handleRejectAnalysis}
          onConfirm={handleConfirmAnalysis}
          onUpdateSummary={handleUpdateAnalysisSummary}
        />
      )}
    </div>
  );
}
