// 익명 채팅 대화 목록 조회 요청과 응답 타입

import { getMockAnonymousChats } from "@/mocks/anonymousChats";

// SENT는 내가 친구에게 물어본 대화, RECEIVED는 익명의 친구가 나에게 물어본 대화
export type AnonymousChatType = "SENT" | "RECEIVED";

export interface AnonymousChatProduct {
  productId: number;
  name: string;
  price: number;
}

export interface AnonymousChatLastMessage {
  content: string;
  isMine: boolean;
  sentAt: string;
}

export interface AnonymousChatListItem {
  chatId: number;
  // SENT 대화는 친구 실명, RECEIVED 대화는 익명 닉네임
  counterpartName: string;
  product: AnonymousChatProduct;
  lastMessage: AnonymousChatLastMessage;
  unreadCount: number;
}

export interface AnonymousChatsPage {
  items: AnonymousChatListItem[];
}

// TODO: 익명 채팅 대화 목록 API 연동 후 목업 데이터 대신 서버 응답 반환 (커서 페이지네이션 여부 확인 필요)
export async function getAnonymousChats(type: AnonymousChatType): Promise<AnonymousChatsPage> {
  return getMockAnonymousChats(type);
}
