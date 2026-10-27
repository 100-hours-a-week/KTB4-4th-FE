// API 연동 전 채팅방 화면 구성을 위한 익명 채팅방·메시지 임시 데이터

import type {
  AnonymousChatMessage,
  AnonymousChatRoom,
  AnonymousChatRoomProduct,
} from "@/lib/api/anonymousChatRoom";
import type { AnonymousChatListItem, AnonymousChatType } from "@/lib/api/anonymousChats";
import { createMockChats } from "@/mocks/anonymousChats";
import { mockDelay } from "@/mocks/config";

const MINUTE_MS = 60_000;

const EMPTY_CHAT_ID = 8;

const PRODUCT_CATEGORY_NAMES: Record<number, string[]> = {
  101: ["은은한 조명", "인테리어 소품"],
  102: ["주방", "커피용품"],
  103: ["디지털", "음향기기"],
  104: ["패션", "가방"],
  105: ["스포츠", "아우터"],
  106: ["캠핑", "아웃도어"],
  107: ["디지털", "카메라"],
};

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

function createRoomProduct(chat: AnonymousChatListItem): AnonymousChatRoomProduct {
  return {
    ...chat.product,
    imageUrl: null,
    categoryNames: PRODUCT_CATEGORY_NAMES[chat.product.productId] ?? [],
  };
}

function createRoomMessages(chat: AnonymousChatListItem): AnonymousChatMessage[] {
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

function createRoom(chat: AnonymousChatListItem, type: AnonymousChatType): AnonymousChatRoom {
  const messages = createRoomMessages(chat);

  return {
    chatId: chat.chatId,
    type,
    counterpartName: chat.counterpartName,
    counterpartUserId: type === "SENT" ? 900_000 + chat.chatId : null,
    counterpartProfileImageUrl: null,
    product: createRoomProduct(chat),
    connectedAt: new Date(Date.parse(messages[0].sentAt) - MINUTE_MS).toISOString(),
    messages,
  };
}

function createEmptyRoom(): AnonymousChatRoom {
  return {
    chatId: EMPTY_CHAT_ID,
    type: "SENT",
    counterpartName: "지호",
    counterpartUserId: 900_000 + EMPTY_CHAT_ID,
    counterpartProfileImageUrl: null,
    product: {
      productId: 108,
      name: "테이블 램프",
      price: 52_000,
      imageUrl: null,
      categoryNames: ["은은한 조명", "인테리어 소품"],
    },
    connectedAt: new Date().toISOString(),
    messages: [],
  };
}

export async function getMockAnonymousChatRoom(chatId: number): Promise<AnonymousChatRoom | null> {
  await mockDelay();

  if (chatId === EMPTY_CHAT_ID) {
    return createEmptyRoom();
  }

  const chats = createMockChats();
  const sentChat = chats.SENT.find((chat) => chat.chatId === chatId);

  if (sentChat) {
    return createRoom(sentChat, "SENT");
  }

  const receivedChat = chats.RECEIVED.find((chat) => chat.chatId === chatId);

  return receivedChat ? createRoom(receivedChat, "RECEIVED") : null;
}

export async function sendMockAnonymousChatMessage(
  chatId: number,
  content: string,
): Promise<AnonymousChatMessage> {
  await mockDelay();

  return {
    messageId: chatId * 1_000_000 + (Date.now() % 1_000_000),
    content,
    isMine: true,
    sentAt: new Date().toISOString(),
  };
}
