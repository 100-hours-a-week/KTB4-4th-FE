// TODO: 모든 익명 대화 API 연동 완료 후 anonymousChats.ts와 함께 삭제할 목업 데이터

import type { AnonymousChatMessage, AnonymousChatRoomMessages } from "@/lib/api/anonymousChatRoom";
import { createMockChats, type MockAnonymousChatListItem } from "@/mocks/anonymousChats";
import { mockDelay } from "@/mocks/config";

const MINUTE_MS = 60_000;

const PREVIOUS_MESSAGES: Record<number, Omit<AnonymousChatMessage, "messageId" | "sentAt">[]> = {
  1: [
    { content: "이거 선물로 받으면 어때?", isMine: true },
    { content: "오 디자인 깔끔하다!", isMine: false },
  ],
  5: [
    { content: "이거 어때? 선물로 받으면 괜찮을까?", isMine: false },
    { content: "좋아! 딱 내 취향이야.", isMine: true },
  ],
};

function createRoomMessages(chat: MockAnonymousChatListItem): AnonymousChatMessage[] {
  const lastSentAt = Date.parse(chat.lastMessage.sentAt);
  const previousMessages = PREVIOUS_MESSAGES[chat.chatId] ?? [];

  return [
    ...previousMessages.map((message, index) => ({
      ...message,
      messageId: chat.chatId * 100 + index + 1,
      sentAt: new Date(lastSentAt - (previousMessages.length - index) * MINUTE_MS).toISOString(),
    })),
    {
      messageId: chat.chatId * 100 + previousMessages.length + 1,
      content: chat.lastMessage.content,
      isMine: chat.lastMessage.isMine,
      sentAt: chat.lastMessage.sentAt,
    },
  ];
}

function createMessageHistory(chat: MockAnonymousChatListItem): AnonymousChatRoomMessages {
  const messages = createRoomMessages(chat);

  return {
    connectedAt: new Date(Date.parse(messages[0].sentAt) - MINUTE_MS).toISOString(),
    messages,
  };
}

function createEmptyMessageHistory(): AnonymousChatRoomMessages {
  return {
    connectedAt: new Date().toISOString(),
    messages: [],
  };
}

export async function getMockAnonymousChatMessages(
  roomId: number,
): Promise<AnonymousChatRoomMessages> {
  await mockDelay();

  const chats = createMockChats();
  const chat = [...chats.SENT, ...chats.RECEIVED].find((item) => item.chatId === roomId);

  return chat ? createMessageHistory(chat) : createEmptyMessageHistory();
}

export async function sendMockAnonymousChatMessage(
  roomId: number,
  content: string,
): Promise<AnonymousChatMessage> {
  await mockDelay();

  return {
    messageId: roomId * 1_000_000 + (Date.now() % 1_000_000),
    content,
    isMine: true,
    sentAt: new Date().toISOString(),
  };
}
