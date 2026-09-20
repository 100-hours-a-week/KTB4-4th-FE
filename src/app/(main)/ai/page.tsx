// AI와의 대화 및 취향 분석 상태를 표시하는 화면

import PreferenceAnalysisBar from "@/components/chat/PreferenceAnalysisBar";
import { temporaryPreferenceAnalysis } from "@/mocks/chat";

export default function AiPage() {
  return (
    <main
      aria-label="AI 대화"
      className="page-content flex flex-1 flex-col bg-background-subtle pt-4"
    >
      {/* TODO: AI 대화 API 응답의 취향 분석 상태로 교체 */}
      <PreferenceAnalysisBar {...temporaryPreferenceAnalysis} />
    </main>
  );
}
