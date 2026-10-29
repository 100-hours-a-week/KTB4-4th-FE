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
type ChatListMergeMode = "replace" | "append";

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

export type AnonymousChatMessageEntity = AnonymousChatMessage & {
  roomId: number;
};

export interface AnonymousChatListPagination {
  nextCursor: string | null;
  hasNext: boolean;
  isInitialized: boolean;
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
  setRoomUnreadCount: (roomId: number, unreadMessageCount: number) => void;
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
    return appendUniqueIds([], nextIds);
  }

  return position === "prepend"
    ? appendUniqueIds(nextIds, currentIds)
    : appendUniqueIds(currentIds, nextIds);
}

function calculateTotalUnreadCount(
  roomsById: Record<number, AnonymousChatRoomEntity>,
  chatIdsByType: Record<AnonymousChatType, number[]>,
) {
  const listedRoomIds = new Set([...chatIdsByType.SENT, ...chatIdsByType.RECEIVED]);

  return Array.from(listedRoomIds).reduce(
    (total, roomId) => total + (roomsById[roomId]?.unreadMessageCount ?? 0),
    0,
  );
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

        roomsById[item.roomId] = {
          ...currentRoom,
          type,
          counterpartAlias: item.counterpartAlias,
          product: {
            ...currentRoom.product,
            ...item.product,
          },
          hasUnreadMessage: item.hasUnreadMessage,
          unreadMessageCount: item.unreadMessageCount,
          lastActiveAt: item.lastActiveAt,
          lastMessage: item.lastMessage,
        };
      });

      const pageIds = page.items.map((item) => item.roomId);
      const chatIds =
        mode === "append"
          ? appendUniqueIds(state.chatIdsByType[type], pageIds)
          : appendUniqueIds([], pageIds);
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
        totalUnreadCount: calculateTotalUnreadCount(roomsById, chatIdsByType),
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
        totalUnreadCount: calculateTotalUnreadCount(roomsById, state.chatIdsByType),
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
        totalUnreadCount: calculateTotalUnreadCount(roomsById, chatIdsByType),
        activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
      };
    }),

  reset: () => set(createInitialState()),
}));
