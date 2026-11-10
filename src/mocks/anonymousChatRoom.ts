// TODO: 익명 대화 메시지 전송 API 연동 완료 후 삭제할 전송 목업

import type { AnonymousChatMessage } from "@/lib/api/anonymousChatRoom";
import { mockDelay } from "@/mocks/config";

export async function sendMockAnonymousChatMessage(
  roomId: number,
  content: string,
): Promise<AnonymousChatMessage> {
  await mockDelay();

  return {
    messageId: roomId * 1_000_000 + (Date.now() % 1_000_000),
    content,
    isMine: true,
    unreadCount: 0,
    sentAt: new Date().toISOString(),
  };
}
