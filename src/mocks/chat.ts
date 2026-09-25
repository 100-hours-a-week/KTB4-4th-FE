// AI 대화 화면의 취향 분석 및 메시지 표시를 위한 임시 데이터

import type {
  ChatMessage,
  PreferenceAnalysis,
  PreferenceAnalysisResult,
  PreferenceAnalysisStatus,
} from "@/types/chat";

// TODO: AI 취향 분석 상태·결과 API 연동 후 아래 취향 분석 Mock 데이터 제거
export const temporaryPreferenceAnalysis: PreferenceAnalysis = {
  progress: 72,
  description: "추천에 필요한 정보를 거의 다 알게 되었어요.",
};

export const temporaryPreferenceAnalysisStatus: PreferenceAnalysisStatus = "COMPLETED";

export const temporaryPreferenceAnalysisResult: PreferenceAnalysisResult = {
  interests: [
    { value: "홈 카페", score: 0.95 },
    { value: "디저트", score: 0.88 },
    { value: "브런치", score: 0.82 },
  ],
  preferences: [
    { value: "편안한 휴식", score: 0.93 },
    { value: "간단한 활동", score: 0.87 },
    { value: "실용적인 물건", score: 0.8 },
  ],
  summary: "집에서 편안하게 쉬며 간단한 요리나 디저트 만들기를 즐기는 편이에요.",
  correctionAvailable: true,
};

// TODO: 비활성·미검증 대화의 메시지 표시 정책 확정 후 아래 대화 Mock 데이터 제거
export const temporaryChatMessages: ChatMessage[] = [
  {
    id: 1,
    role: "ASSISTANT",
    senderName: "니쥬",
    content: "요즘 집에서 가장 자주 하는 취미가 있나요?",
  },
  {
    id: 2,
    role: "USER",
    senderName: "나",
    content: "최근에는 방에만 누워있어요.\n침대에서 자는게 최고",
  },
  {
    id: 3,
    role: "ASSISTANT",
    senderName: "니쥬",
    content:
      "맞아요! 휴일에는 집에서 온전히 쉬는게 최고죠\n집에서는 수면외에 어떤 활동을 선호하시나요?",
  },
  {
    id: 4,
    role: "USER",
    senderName: "나",
    content: "모르겠어요. 하나 뽑자면 요리하기??",
  },
  {
    id: 5,
    role: "ASSISTANT",
    senderName: "니쥬",
    content: "필요한 정보가 모두 모였어요.\n분석을 시작합니다!",
  },
  {
    id: 6,
    role: "USER",
    senderName: "나",
    content: "좋아요. 어떤 결과가 나올지 궁금해요.",
  },
  {
    id: 7,
    role: "ASSISTANT",
    senderName: "니쥬",
    content: "평소 집에서 편안하게 쉴 수 있는 활동을 좋아하시는 것 같아요.",
  },
  {
    id: 8,
    role: "USER",
    senderName: "나",
    content: "맞아요. 복잡한 활동보다는 가볍게 할 수 있는 게 좋아요.",
  },
  {
    id: 9,
    role: "ASSISTANT",
    senderName: "니쥬",
    content: "요리할 때 자주 사용하는 도구나 관심 있는 메뉴가 있나요?",
  },
  {
    id: 10,
    role: "USER",
    senderName: "나",
    content: "간단한 디저트나 브런치를 만들어 보고 싶어요.",
  },
  {
    id: 11,
    role: "ASSISTANT",
    senderName: "니쥬",
    content: "알려주신 내용을 바탕으로 취향에 맞는 추천을 준비할게요!",
  },
];
