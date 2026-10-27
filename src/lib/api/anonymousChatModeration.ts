// 익명 채팅방 단위 사용자 신고·차단 요청 타입과 요청 함수

import {
  blockMockAnonymousChatUser,
  reportMockAnonymousChatUser,
} from "@/mocks/anonymousChatModeration";

export type AnonymousChatReportReason = "ABUSE" | "SEXUAL" | "SPAM" | "PERSONAL_INFO" | "OTHER";

export interface AnonymousChatReportRequest {
  reason: AnonymousChatReportReason;
  // OTHER 사유일 때만 필수이며 최대 500자
  description?: string;
}

export const ANONYMOUS_CHAT_REPORT_DESCRIPTION_MAX_LENGTH = 500;

// TODO: 익명 채팅 신고 API 연동 후 목업 응답 대신 서버 요청
export async function reportAnonymousChatUser(
  chatId: number,
  request: AnonymousChatReportRequest,
): Promise<void> {
  return reportMockAnonymousChatUser(chatId, request);
}

// TODO: 익명 채팅 사용자 차단 API 연동 후 목업 응답 대신 서버 요청
export async function blockAnonymousChatUser(chatId: number): Promise<void> {
  return blockMockAnonymousChatUser(chatId);
}
