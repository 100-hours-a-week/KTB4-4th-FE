// AI 대화 화면의 취향 분석 설명 임시 데이터

type PreferenceAnalysisProgressStep = 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;

// TODO: 취향 분석 진행률 설명 API 연동 후 Mock 설명 문구 교체
const preferenceAnalysisDescriptions: Record<PreferenceAnalysisProgressStep, string> = {
  0: "아직 취향을 알아가는 중이에요.",
  10: "취향을 하나씩 알아가고 있어요.",
  20: "좋아하는 것들의 힌트를 찾고 있어요.",
  30: "취향의 윤곽이 조금씩 보이고 있어요.",
  40: "관심 있는 분야를 정리하고 있어요.",
  50: "취향의 절반 정도를 알아냈어요.",
  60: "좋아하는 요소들을 구체화하고 있어요.",
  70: "취향에 어울리는 기준을 정리하고 있어요.",
  80: "추천에 필요한 정보를 거의 다 알게 되었어요.",
  90: "취향 분석을 마무리하고 있어요.",
  100: "취향 분석이 완료되었어요.",
};

export const getPreferenceAnalysisDescription = (progress: number) => {
  const finiteProgress = Number.isFinite(progress) ? progress : 0;
  const clampedProgress = Math.min(Math.max(finiteProgress, 0), 100);
  const progressStep = (Math.floor(clampedProgress / 10) * 10) as PreferenceAnalysisProgressStep;

  return preferenceAnalysisDescriptions[progressStep];
};
