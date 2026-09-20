// AI와의 대화 및 취향 분석 상태를 표시하는 화면

import ChatRoom from "@/components/chat/ChatRoom";
import PreferenceAnalysisBar from "@/components/chat/PreferenceAnalysisBar";
import {
  temporaryChatMessages,
  temporaryPreferenceAnalysis,
  temporaryPreferenceAnalysisStatus,
} from "@/mocks/chat";

export default function AiPage() {
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
        analysisStatus={temporaryPreferenceAnalysisStatus}
      />
    </main>
  );
}
