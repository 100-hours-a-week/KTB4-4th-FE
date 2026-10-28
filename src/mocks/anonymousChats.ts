// API 연동 전 대화 목록 화면 구성을 위한 익명 채팅 임시 데이터

import type {
  AnonymousChatListItem,
  AnonymousChatsPage,
  AnonymousChatType,
} from "@/lib/api/anonymousChats";
import { mockDelay } from "@/mocks/config";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// 시간 표기 형태별로 확인할 수 있도록 현재 시각 기준 경과 시간으로 전송 시각 생성
function getSentAt(elapsedMs: number) {
  return new Date(Date.now() - elapsedMs).toISOString();
}

export function createMockChats(): Record<AnonymousChatType, AnonymousChatListItem[]> {
  return {
    SENT: [
      {
        chatId: 1,
        counterpartName: "지호",
        product: { productId: 101, name: "무광 테이블 램프", price: 52_000 },
        lastMessage: {
          content: "헐, 완전 내 취향인데? 검정색 좋아!",
          isMine: false,
          sentAt: getSentAt(10_000),
        },
        unreadCount: 2,
      },
      {
        chatId: 2,
        counterpartName: "민서",
        product: { productId: 102, name: "스테인리스 커피 드리퍼", price: 38_000 },
        lastMessage: {
          content: "이거 선물로 받으면 어때?",
          isMine: true,
          sentAt: getSentAt(3 * HOUR_MS),
        },
        unreadCount: 0,
      },
      {
        chatId: 3,
        counterpartName: "준호",
        product: { productId: 103, name: "노이즈 캔슬링 헤드폰", price: 189_000 },
        lastMessage: {
          content: "이거 좋다! 출퇴근할 때 잘 쓸 것 같아",
          isMine: false,
          sentAt: getSentAt(DAY_MS + HOUR_MS),
        },
        unreadCount: 0,
      },
      {
        chatId: 4,
        counterpartName: "서연",
        product: { productId: 104, name: "나일론 미니 백", price: 79_000 },
        lastMessage: {
          content: "이 색 너한테 잘 어울릴 것 같아?",
          isMine: true,
          sentAt: getSentAt(4 * DAY_MS),
        },
        unreadCount: 0,
      },
    ],
    RECEIVED: [
      {
        chatId: 5,
        counterpartName: "산책하는 수달",
        product: { productId: 105, name: "오프화이트 러닝 재킷", price: 128_000 },
        lastMessage: {
          content: "이거 선물로 받으면 어때?",
          isMine: false,
          sentAt: getSentAt(3 * MINUTE_MS),
        },
        unreadCount: 1,
      },
      {
        chatId: 6,
        counterpartName: "졸린 토끼",
        product: { productId: 106, name: "접이식 캠핑 체어", price: 65_000 },
        lastMessage: {
          content: "완전 내 취향이야!",
          isMine: true,
          sentAt: getSentAt(3 * DAY_MS),
        },
        unreadCount: 0,
      },
      {
        chatId: 7,
        counterpartName: "푸른 고래",
        product: { productId: 107, name: "포켓 필름 카메라", price: 94_000 },
        lastMessage: {
          content: "이거 어때? 어떤 색이 좋아?",
          isMine: false,
          sentAt: getSentAt(10 * DAY_MS),
        },
        unreadCount: 0,
      },
    ],
  };
}

// 나간 대화방이 목록을 다시 불러와도 나타나지 않도록 새로고침 전까지 기억함
const leftChatIds = new Set<number>();

export async function getMockAnonymousChats(type: AnonymousChatType): Promise<AnonymousChatsPage> {
  await mockDelay();

  return { items: createMockChats()[type].filter((chat) => !leftChatIds.has(chat.chatId)) };
}

export async function leaveMockAnonymousChat(chatId: number) {
  await mockDelay();

  leftChatIds.add(chatId);
}
