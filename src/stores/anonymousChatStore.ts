// 익명대화 연결 상태와 방·메시지 정규화 데이터를 관리하는 전역 스토어

import { create } from "zustand";

import type {
  AnonymousChatMessage,
  AnonymousChatRoomEndedReason,
  AnonymousChatRoomInfo,
  AnonymousChatRoomMessages,
  AnonymousChatRoomStatus,
} from "@/lib/api/anonymousChatRoom";
import type {
  AnonymousChatLastMessage,
  AnonymousChatsPage,
  AnonymousChatType,
} from "@/lib/api/anonymousChats";
import type {
  AnonymousChatConnectionStatus,
  AnonymousChatStompErrorPayload,
} from "@/lib/websocket/anonymousChatProtocol";

type MessageMergePosition = "replace" | "prepend" | "append";
type ChatListMergeMode = "replace" | "refresh" | "append";

export interface AnonymousChatProductEntity {
  productId: number;
  name: string;
  price?: number;
  imageUrl?: string | null;
  category?: string;
}

export interface AnonymousChatRoomEntity {
  roomId: number;
  type?: AnonymousChatType;
  counterpartName?: string;
  counterpartAlias?: string;
  product?: AnonymousChatProductEntity;
  hasUnreadMessage: boolean;
  unreadMessageCount: number;
  lastActiveAt?: string;
  lastMessage?: AnonymousChatLastMessage | null;
  roomStatus?: AnonymousChatRoomStatus;
  endedReason?: AnonymousChatRoomEndedReason | null;
  endedAt?: string | null;
  nextCursor?: string | null;
  hasNext?: boolean;
  isInfoLoaded: boolean;
  areMessagesLoaded: boolean;
}

export type AnonymousChatMessageEntity = AnonymousChatMessage & { roomId: number };

export interface AnonymousChatListPagination {
  nextCursor: string | null;
  hasNext: boolean;
  isInitialized: boolean;
}

export interface AnonymousChatRoomEndUpdate {
  endedReason?: AnonymousChatRoomEndedReason | null;
  endedAt?: string | null;
}

interface AnonymousChatState {
  connectionStatus: AnonymousChatConnectionStatus;
  connectionError: AnonymousChatStompErrorPayload | null;
  roomsById: Record<number, AnonymousChatRoomEntity>;
  chatIdsByType: Record<AnonymousChatType, number[]>;
  listPaginationByType: Record<AnonymousChatType, AnonymousChatListPagination>;
  messagesById: Record<number, AnonymousChatMessageEntity>;
  messageIdsByRoomId: Record<number, number[]>;
  totalUnreadCount: number;
  activeRoomId: number | null;
  setConnectionStatus: (status: AnonymousChatConnectionStatus) => void;
  setConnectionError: (error: AnonymousChatStompErrorPayload | null) => void;
  setActiveRoomId: (roomId: number | null) => void;
  mergeChatListPage: (
    type: AnonymousChatType,
    page: AnonymousChatsPage,
    mode?: ChatListMergeMode,
  ) => void;
  mergeRoomInfo: (roomInfo: AnonymousChatRoomInfo) => void;
  mergeRoomMessages: (
    roomId: number,
    page: AnonymousChatRoomMessages,
    position?: MessageMergePosition,
  ) => void;
  upsertMessage: (roomId: number, message: AnonymousChatMessage) => void;
  applyRealtimeMessage: (
    message: AnonymousChatMessageEntity,
    options?: { incrementRoomUnreadCount?: boolean },
  ) => void;
  markOwnMessagesRead: (roomId: number, lastReadMessageId: number) => void;
  acknowledgeRoomRead: (roomId: number, lastReadMessageId: number) => void;
  setRoomUnreadCount: (roomId: number, unreadMessageCount: number) => void;
  markRoomEnded: (roomId: number, update?: AnonymousChatRoomEndUpdate) => void;
  removeRoom: (roomId: number) => void;
  reset: () => void;
}

function createInitialPagination(): Record<AnonymousChatType, AnonymousChatListPagination> {
  return {
    SENT: { nextCursor: null, hasNext: false, isInitialized: false },
    RECEIVED: { nextCursor: null, hasNext: false, isInitialized: false },
  };
}

function createInitialState() {
  return {
    connectionStatus: "idle" as const,
    connectionError: null,
    roomsById: {},
    chatIdsByType: { SENT: [], RECEIVED: [] },
    listPaginationByType: createInitialPagination(),
    messagesById: {},
    messageIdsByRoomId: {},
    totalUnreadCount: 0,
    activeRoomId: null,
  };
}

function createRoomEntity(roomId: number): AnonymousChatRoomEntity {
  return {
    roomId,
    hasUnreadMessage: false,
    unreadMessageCount: 0,
    isInfoLoaded: false,
    areMessagesLoaded: false,
  };
}

function appendUniqueIds(currentIds: number[], nextIds: number[]) {
  const uniqueIds = new Set(currentIds);

  nextIds.forEach((id) => uniqueIds.add(id));

  return Array.from(uniqueIds);
}

function mergeMessageIds(currentIds: number[], nextIds: number[], position: MessageMergePosition) {
  if (position === "replace") {
    return appendUniqueIds(currentIds, nextIds).sort((left, right) => left - right);
  }

  return position === "prepend"
    ? appendUniqueIds(nextIds, currentIds)
    : appendUniqueIds(currentIds, nextIds);
}

function calculateTotalUnreadCount(roomsById: Record<number, AnonymousChatRoomEntity>) {
  return Object.values(roomsById).reduce((total, room) => total + room.unreadMessageCount, 0);
}

function sortChatIdsByLastActiveAt(
  chatIds: number[],
  roomsById: Record<number, AnonymousChatRoomEntity>,
) {
  return [...chatIds].sort((leftId, rightId) => {
    const leftTime = Date.parse(roomsById[leftId]?.lastActiveAt ?? "");
    const rightTime = Date.parse(roomsById[rightId]?.lastActiveAt ?? "");

    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });
}

export const useAnonymousChatStore = create<AnonymousChatState>((set) => ({
  ...createInitialState(),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setConnectionError: (connectionError) => set({ connectionError }),

  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),

  mergeChatListPage: (type, page, mode = "replace") =>
    set((state) => {
      const roomsById = { ...state.roomsById };

      page.items.forEach((item) => {
        const currentRoom = roomsById[item.roomId] ?? createRoomEntity(item.roomId);
        const isStalePageItem =
          currentRoom.lastMessage !== undefined &&
          currentRoom.lastMessage !== null &&
          (item.lastMessage === null ||
            item.lastMessage.messageId < currentRoom.lastMessage.messageId);

        roomsById[item.roomId] = {
          ...currentRoom,
          type,
          counterpartAlias: item.counterpartAlias,
          product: {
            ...currentRoom.product,
            ...item.product,
          },
          hasUnreadMessage: isStalePageItem ? currentRoom.hasUnreadMessage : item.hasUnreadMessage,
          unreadMessageCount: isStalePageItem
            ? currentRoom.unreadMessageCount
            : item.unreadMessageCount,
          lastActiveAt: isStalePageItem ? currentRoom.lastActiveAt : item.lastActiveAt,
          lastMessage: isStalePageItem ? currentRoom.lastMessage : item.lastMessage,
        };
      });

      const pageIds = page.items.map((item) => item.roomId);
      const chatIds = sortChatIdsByLastActiveAt(
        mode === "append"
          ? appendUniqueIds(state.chatIdsByType[type], pageIds)
          : mode === "refresh"
            ? appendUniqueIds(pageIds, state.chatIdsByType[type])
            : appendUniqueIds([], pageIds),
        roomsById,
      );
      const chatIdsByType = {
        ...state.chatIdsByType,
        [type]: chatIds,
      };

      return {
        roomsById,
        chatIdsByType,
        listPaginationByType: {
          ...state.listPaginationByType,
          [type]: {
            nextCursor: page.nextCursor,
            hasNext: page.hasNext,
            isInitialized: true,
          },
        },
        totalUnreadCount: calculateTotalUnreadCount(roomsById),
      };
    }),

  mergeRoomInfo: (roomInfo) =>
    set((state) => {
      const currentRoom = state.roomsById[roomInfo.roomId] ?? createRoomEntity(roomInfo.roomId);

      return {
        roomsById: {
          ...state.roomsById,
          [roomInfo.roomId]: {
            ...currentRoom,
            type: roomInfo.type,
            counterpartName: roomInfo.counterpartName,
            product: {
              ...currentRoom.product,
              ...roomInfo.product,
            },
            isInfoLoaded: true,
          },
        },
      };
    }),

  mergeRoomMessages: (roomId, page, position = "replace") =>
    set((state) => {
      const messagesById = { ...state.messagesById };

      page.messages.forEach((message) => {
        messagesById[message.messageId] = { ...message, roomId };
      });

      const currentMessageIds = state.messageIdsByRoomId[roomId] ?? [];
      const nextMessageIds = page.messages.map((message) => message.messageId);
      const currentRoom = state.roomsById[roomId] ?? createRoomEntity(roomId);

      return {
        roomsById: {
          ...state.roomsById,
          [roomId]: {
            ...currentRoom,
            roomStatus: page.roomStatus,
            endedReason: page.endedReason,
            endedAt: page.endedAt,
            nextCursor:
              position === "append" && currentRoom.areMessagesLoaded
                ? currentRoom.nextCursor
                : page.nextCursor,
            hasNext:
              position === "append" && currentRoom.areMessagesLoaded
                ? currentRoom.hasNext
                : page.hasNext,
            areMessagesLoaded: true,
          },
        },
        messagesById,
        messageIdsByRoomId: {
          ...state.messageIdsByRoomId,
          [roomId]: mergeMessageIds(currentMessageIds, nextMessageIds, position),
        },
      };
    }),

  upsertMessage: (roomId, message) =>
    set((state) => {
      const currentMessageIds = state.messageIdsByRoomId[roomId] ?? [];

      return {
        roomsById: {
          ...state.roomsById,
          [roomId]: state.roomsById[roomId] ?? createRoomEntity(roomId),
        },
        messagesById: {
          ...state.messagesById,
          [message.messageId]: { ...message, roomId },
        },
        messageIdsByRoomId: {
          ...state.messageIdsByRoomId,
          [roomId]: appendUniqueIds(currentMessageIds, [message.messageId]),
        },
      };
    }),

  applyRealtimeMessage: (message, options) =>
    set((state) => {
      const currentRoom = state.roomsById[message.roomId] ?? createRoomEntity(message.roomId);
      const currentMessage = state.messagesById[message.messageId];
      const isNewMessage = currentMessage === undefined;
      const unreadMessageCount =
        isNewMessage && options?.incrementRoomUnreadCount
          ? currentRoom.unreadMessageCount + 1
          : currentRoom.unreadMessageCount;
      const isLatestMessage =
        !currentRoom.lastMessage || message.messageId >= currentRoom.lastMessage.messageId;
      const roomsById = {
        ...state.roomsById,
        [message.roomId]: {
          ...currentRoom,
          hasUnreadMessage: unreadMessageCount > 0,
          unreadMessageCount,
          lastActiveAt: isLatestMessage ? message.sentAt : currentRoom.lastActiveAt,
          lastMessage: isLatestMessage
            ? {
                messageId: message.messageId,
                content: message.content,
                sender: message.isMine ? "ME" : "OTHER",
                sentAt: message.sentAt,
              }
            : currentRoom.lastMessage,
        },
      };
      const chatIdsByType = currentRoom.type
        ? {
            ...state.chatIdsByType,
            [currentRoom.type]:
              isLatestMessage && state.chatIdsByType[currentRoom.type].includes(message.roomId)
                ? [
                    message.roomId,
                    ...state.chatIdsByType[currentRoom.type].filter((id) => id !== message.roomId),
                  ]
                : state.chatIdsByType[currentRoom.type],
          }
        : state.chatIdsByType;

      return {
        roomsById,
        chatIdsByType,
        messagesById: {
          ...state.messagesById,
          [message.messageId]: {
            ...message,
            // 같은 clientMessageId 재전송 확인이 늦게 와도 이미 반영된 읽음 상태를 되돌리지 않음
            unreadCount: currentMessage?.unreadCount ?? message.unreadCount,
          },
        },
        messageIdsByRoomId: {
          ...state.messageIdsByRoomId,
          [message.roomId]: appendUniqueIds(state.messageIdsByRoomId[message.roomId] ?? [], [
            message.messageId,
          ]),
        },
        totalUnreadCount: calculateTotalUnreadCount(roomsById),
      };
    }),

  markOwnMessagesRead: (roomId, lastReadMessageId) =>
    set((state) => {
      const lastReadMessage = state.messagesById[lastReadMessageId];

      // 양쪽에 같은 이벤트가 와도 기준 메시지를 보낸 사용자만 발신 메시지 읽음 상태를 갱신함
      if (!lastReadMessage || lastReadMessage.roomId !== roomId || !lastReadMessage.isMine) {
        return state;
      }

      const messagesById = { ...state.messagesById };

      (state.messageIdsByRoomId[roomId] ?? []).forEach((messageId) => {
        const message = messagesById[messageId];

        if (message?.isMine && messageId <= lastReadMessageId && message.unreadCount > 0) {
          messagesById[messageId] = { ...message, unreadCount: 0 };
        }
      });

      return { messagesById };
    }),

  acknowledgeRoomRead: (roomId, lastReadMessageId) =>
    set((state) => {
      const currentRoom = state.roomsById[roomId] ?? createRoomEntity(roomId);
      const unreadMessageCount = (state.messageIdsByRoomId[roomId] ?? []).reduce(
        (count, messageId) => {
          const message = state.messagesById[messageId];

          return message && !message.isMine && messageId > lastReadMessageId ? count + 1 : count;
        },
        0,
      );
      const roomsById = {
        ...state.roomsById,
        [roomId]: {
          ...currentRoom,
          hasUnreadMessage: unreadMessageCount > 0,
          unreadMessageCount,
        },
      };

      return {
        roomsById,
        totalUnreadCount: calculateTotalUnreadCount(roomsById),
      };
    }),

  setRoomUnreadCount: (roomId, unreadMessageCount) =>
    set((state) => {
      const currentRoom = state.roomsById[roomId] ?? createRoomEntity(roomId);
      const normalizedUnreadCount = Math.max(0, Math.trunc(unreadMessageCount));
      const roomsById = {
        ...state.roomsById,
        [roomId]: {
          ...currentRoom,
          hasUnreadMessage: normalizedUnreadCount > 0,
          unreadMessageCount: normalizedUnreadCount,
        },
      };

      return {
        roomsById,
        totalUnreadCount: calculateTotalUnreadCount(roomsById),
      };
    }),

  markRoomEnded: (roomId, update) =>
    set((state) => {
      const currentRoom = state.roomsById[roomId] ?? createRoomEntity(roomId);
      const roomsById = {
        ...state.roomsById,
        [roomId]: {
          ...currentRoom,
          roomStatus: "ENDED" as const,
          hasUnreadMessage: false,
          unreadMessageCount: 0,
          ...(update?.endedReason !== undefined ? { endedReason: update.endedReason } : {}),
          ...(update?.endedAt !== undefined ? { endedAt: update.endedAt } : {}),
        },
      };

      return {
        roomsById,
        chatIdsByType: {
          SENT: state.chatIdsByType.SENT.filter((id) => id !== roomId),
          RECEIVED: state.chatIdsByType.RECEIVED.filter((id) => id !== roomId),
        },
        totalUnreadCount: calculateTotalUnreadCount(roomsById),
      };
    }),

  removeRoom: (roomId) =>
    set((state) => {
      const roomsById = { ...state.roomsById };
      const messagesById = { ...state.messagesById };
      const messageIdsByRoomId = { ...state.messageIdsByRoomId };

      delete roomsById[roomId];
      (messageIdsByRoomId[roomId] ?? []).forEach((messageId) => {
        delete messagesById[messageId];
      });
      delete messageIdsByRoomId[roomId];

      const chatIdsByType = {
        SENT: state.chatIdsByType.SENT.filter((id) => id !== roomId),
        RECEIVED: state.chatIdsByType.RECEIVED.filter((id) => id !== roomId),
      };

      return {
        roomsById,
        chatIdsByType,
        messagesById,
        messageIdsByRoomId,
        totalUnreadCount: calculateTotalUnreadCount(roomsById),
        activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
      };
    }),

  reset: () => set(createInitialState()),
}));
