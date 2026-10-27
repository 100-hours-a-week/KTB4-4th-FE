// 익명 채팅방 정보·메시지 조회와 메시지 전송 요청 및 응답 타입

import type { AnonymousChatProduct, AnonymousChatType } from "@/lib/api/anonymousChats";
import { getMockAnonymousChatRoom, sendMockAnonymousChatMessage } from "@/mocks/anonymousChatRoom";

export interface AnonymousChatRoomProduct extends AnonymousChatProduct {
  imageUrl: string | null;
  categoryNames: string[];
}

export interface AnonymousChatMessage {
  messageId: number;
  content: string;
  isMine: boolean;
  sentAt: string;
}

export interface AnonymousChatRoom {
  chatId: number;
  type: AnonymousChatType;
  counterpartName: string;
  // TODO: 친구 선물 상품 상세 이동에 필요한 친구 ID 제공 여부 API 연동 시 확인 (RECEIVED 대화는 익명이라 null)
  counterpartUserId: number | null;
  // TODO: 상대 프로필 이미지 정책 확정 후 API 응답 값으로 표시
  counterpartProfileImageUrl: string | null;
  product: AnonymousChatRoomProduct;
  connectedAt: string;
  messages: AnonymousChatMessage[];
}

// TODO: 익명 채팅방 조회 API 연동 후 목업 데이터 대신 서버 응답 반환 (메시지 페이지네이션 여부 확인 필요)
export async function getAnonymousChatRoom(chatId: number): Promise<AnonymousChatRoom | null> {
  return getMockAnonymousChatRoom(chatId);
}

// TODO: 익명 채팅 메시지 전송 API 연동 후 서버에 저장된 메시지 반환
export async function sendAnonymousChatMessage(
  chatId: number,
  content: string,
): Promise<AnonymousChatMessage> {
  return sendMockAnonymousChatMessage(chatId, content);
}
