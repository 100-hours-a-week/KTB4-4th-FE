// API 연동 전 신고·차단 모달 동작 확인을 위한 익명 채팅 신고·차단 임시 응답

import type { AnonymousChatReportRequest } from "@/lib/api/anonymousChatModeration";
import { mockDelay } from "@/mocks/config";

export async function reportMockAnonymousChatUser(
  _chatId: number,
  _request: AnonymousChatReportRequest,
): Promise<void> {
  await mockDelay();
}

export async function blockMockAnonymousChatUser(_chatId: number): Promise<void> {
  await mockDelay();
}
