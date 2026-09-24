// AI 대화 메시지 상태와 입력창을 연결하는 대화방 컴포넌트

"use client";

import { useEffect, useRef, useState } from "react";

import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageList from "@/components/chat/ChatMessageList";
import PreferenceAnalysisLoadingModal from "@/components/chat/PreferenceAnalysisLoadingModal";
import PreferenceAnalysisResultModal from "@/components/chat/PreferenceAnalysisResultModal";
import PreferenceAnalysisTimeoutModal from "@/components/chat/PreferenceAnalysisTimeoutModal";
import type { ChatMessage, PreferenceAnalysisResult, PreferenceAnalysisStatus } from "@/types/chat";

type ChatRoomProps = {
  initialMessages: ChatMessage[];
  initialAnalysisStatus: PreferenceAnalysisStatus;
  analysisResult: PreferenceAnalysisResult;
  isInputLocked?: boolean;
};

export default function ChatRoom({
  initialMessages,
  initialAnalysisStatus,
  analysisResult,
  isInputLocked = false,
}: ChatRoomProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [analysisStatus, setAnalysisStatus] = useState(initialAnalysisStatus);
  const messageListRef = useRef<HTMLElement>(null);
  const isInitialRender = useRef(true);
  const nextMessageId = useRef(Math.max(0, ...initialMessages.map(({ id }) => id)) + 1);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const messageList = messageListRef.current;
    messageList?.scrollTo({ top: messageList.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = (content: string) => {
    // TODO: AI 대화 API 연동 후 사용자 메시지 전송 및 응답 처리로 교체
    const newMessage: ChatMessage = {
      id: nextMessageId.current,
      role: "USER",
      senderName: "나",
      content,
    };

    nextMessageId.current += 1;
    setMessages((currentMessages) => [...currentMessages, newMessage]);
  };

  const handleReturnToChat = () => {
    setAnalysisStatus("IDLE");
  };

  const handleRetryAnalysis = () => {
    // TODO: AI 취향 분석 재요청 API 연동 후 분석 상태 갱신 처리
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
      <ChatComposer onSend={handleSend} isDisabled={isInputLocked} />
      <PreferenceAnalysisLoadingModal open={analysisStatus === "LOADING"} />
      <PreferenceAnalysisTimeoutModal
        open={analysisStatus === "TIMEOUT"}
        onReturnToChat={handleReturnToChat}
        onRetryAnalysis={handleRetryAnalysis}
      />
      <PreferenceAnalysisResultModal
        open={analysisStatus === "COMPLETED"}
        result={analysisResult}
        onReject={handleRejectAnalysis}
        onConfirm={handleConfirmAnalysis}
      />
    </div>
  );
}
