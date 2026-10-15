// AI 대화 화면에서 사용하는 메시지, 취향 분석 정보와 AI 대화 SSE 스트림 이벤트 데이터 타입

import type { AiConversationStatus } from "@/lib/api/aiConversations";

export interface PreferenceAnalysis {
  progress: number;
  description: string;
}

export interface PreferenceAnalysisKeyword {
  value: string;
  score: number;
}

export interface PreferenceAnalysisResult {
  interests: PreferenceAnalysisKeyword[];
  preferences: PreferenceAnalysisKeyword[];
  summary: string | null;
  correctionAvailable: boolean;
}

export type PreferenceAnalysisStatus = "IDLE" | "LOADING" | "TIMEOUT" | "COMPLETED";

export type ChatMessageRole = "ASSISTANT" | "USER";
export type ChatMessageId = number | string;
export type ChatMessageDeliveryStatus = "SENT" | "FAILED" | "RETRYING" | "CANCELED";

export interface ChatMessage {
  id: ChatMessageId;
  role: ChatMessageRole;
  senderName: string;
  content: string;
  deliveryStatus: ChatMessageDeliveryStatus;
  // 이 화면에서 보낸 사용자 메시지만 가지며 재전송할 때 같은 값을 사용함
  clientMessageId?: string;
}

export interface AiConversationConnectedEvent {
  conversationId: number;
  status: AiConversationStatus;
  inputLocked: boolean;
  // true면 이전에 보낸 메시지의 답변이 아직 생성 중이며 pendingUserMessageId가 그 메시지
  generating: boolean;
  pendingUserMessageId: number | null;
}

export interface AiConversationAcceptedEvent {
  userMessageId: number;
  clientMessageId: string;
}

export interface AiConversationDeltaEvent {
  userMessageId: number;
  // 0부터 1씩 증가하며 재전송하면 0부터 다시 시작함
  index: number;
  text: string;
}

// 메시지 전송 API가 200으로 응답할 때의 data와 같은 형식
export interface AiConversationCompletedEvent {
  userMessageId: number;
  messageId: number;
  content: string;
  progress: number;
  inputLocked: boolean;
}

export interface AiConversationErrorEvent {
  userMessageId: number;
  message: string;
  retryable: boolean;
  restartRequired: boolean;
}

// 한 턴의 끝이며 연결은 계속 열려 있음
export interface AiConversationDoneEvent {
  userMessageId: number;
}
