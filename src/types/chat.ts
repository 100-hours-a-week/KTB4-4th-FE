// AI 대화 화면에서 사용하는 취향 분석 정보 타입

export interface PreferenceAnalysis {
  progress: number;
  description: string;
}

export type ChatMessageRole = "ASSISTANT" | "USER";

export interface ChatMessage {
  id: number;
  role: ChatMessageRole;
  senderName: string;
  content: string;
}
