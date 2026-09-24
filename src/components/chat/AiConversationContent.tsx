// 검증된 AI 대화 시작 상태에 따라 대화 화면 동작을 제어하는 콘텐츠
"use client";

import ChatRoom from "@/components/chat/ChatRoom";
import PreferenceAnalysisBar from "@/components/chat/PreferenceAnalysisBar";
import { useAiConversationContext } from "@/contexts/AiConversationContext";
import {
  temporaryChatMessages,
  temporaryPreferenceAnalysis,
  temporaryPreferenceAnalysisResult,
  temporaryPreferenceAnalysisStatus,
} from "@/mocks/chat";

type AiConversationContentProps = {
  conversationId?: string;
  status?: string;
};

export default function AiConversationContent({
  conversationId,
  status,
}: AiConversationContentProps) {
  const { conversation } = useAiConversationContext();
  const isVerifiedConversation =
    conversation !== null &&
    String(conversation.conversationId) === conversationId &&
    conversation.status === status;
  const verifiedStatus = isVerifiedConversation ? conversation.status : undefined;

  if (verifiedStatus === "ACTIVE") {
    // TODO: AI 대화 목록 조회 API 연동 시 conversationId로 기존 메시지 조회
  }

  return (
    <main
      aria-label="AI 대화"
      className="page-content flex min-h-0 flex-1 flex-col bg-background-subtle pt-4"
    >
      {/* TODO: AI 대화 API 응답의 취향 분석 상태로 교체 */}
      <PreferenceAnalysisBar {...temporaryPreferenceAnalysis} />

      {/* TODO: AI 대화 API 응답의 메시지 목록으로 교체 */}
      {/* TODO: AI 대화 API의 취향 분석 상태로 Mock 상태를 교체 */}
      <ChatRoom
        initialMessages={temporaryChatMessages}
        initialAnalysisStatus={temporaryPreferenceAnalysisStatus}
        analysisResult={temporaryPreferenceAnalysisResult}
        isInputLocked={verifiedStatus === "ANALYZING"}
      />
    </main>
  );
}
