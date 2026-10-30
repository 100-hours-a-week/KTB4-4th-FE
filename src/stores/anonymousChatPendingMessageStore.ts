// 익명대화 메시지의 전송 대기·실패 상태를 clientMessageId 기준으로 관리하는 전역 스토어
"use client";

import { create } from "zustand";

export type AnonymousChatPendingMessageStatus = "SENDING" | "FAILED";

export interface AnonymousChatPendingMessageFailure {
  code: string;
  message: string;
  failedAt: string;
  retryAfterSeconds?: number;
}

export interface AnonymousChatPendingMessage {
  roomId: number;
  clientMessageId: string;
  content: string;
  sentAt: string;
  lastAttemptAt: string;
  status: AnonymousChatPendingMessageStatus;
  failure: AnonymousChatPendingMessageFailure | null;
}

export type NewAnonymousChatPendingMessage = Pick<
  AnonymousChatPendingMessage,
  "roomId" | "clientMessageId" | "content" | "sentAt" | "lastAttemptAt"
>;

interface AnonymousChatPendingMessageState {
  messagesByClientMessageId: Record<string, AnonymousChatPendingMessage>;
  clientMessageIdsByRoomId: Record<number, string[]>;
  addPendingMessage: (message: NewAnonymousChatPendingMessage) => void;
  markPendingMessageSending: (clientMessageId: string, lastAttemptAt: string) => void;
  markPendingMessageFailed: (
    clientMessageId: string,
    failure: AnonymousChatPendingMessageFailure,
  ) => void;
  removePendingMessage: (clientMessageId: string) => void;
  removePendingMessagesByRoomId: (roomId: number) => void;
  reset: () => void;
}

function createInitialState() {
  return {
    messagesByClientMessageId: {},
    clientMessageIdsByRoomId: {},
  };
}

export const useAnonymousChatPendingMessageStore = create<AnonymousChatPendingMessageState>(
  (set) => ({
    ...createInitialState(),

    addPendingMessage: (message) =>
      set((state) => {
        if (state.messagesByClientMessageId[message.clientMessageId]) {
          return state;
        }

        return {
          messagesByClientMessageId: {
            ...state.messagesByClientMessageId,
            [message.clientMessageId]: {
              ...message,
              status: "SENDING",
              failure: null,
            },
          },
          clientMessageIdsByRoomId: {
            ...state.clientMessageIdsByRoomId,
            [message.roomId]: [
              ...(state.clientMessageIdsByRoomId[message.roomId] ?? []),
              message.clientMessageId,
            ],
          },
        };
      }),

    markPendingMessageSending: (clientMessageId, lastAttemptAt) =>
      set((state) => {
        const message = state.messagesByClientMessageId[clientMessageId];

        if (!message) return state;

        return {
          messagesByClientMessageId: {
            ...state.messagesByClientMessageId,
            [clientMessageId]: {
              ...message,
              lastAttemptAt,
              status: "SENDING",
              failure: null,
            },
          },
        };
      }),

    markPendingMessageFailed: (clientMessageId, failure) =>
      set((state) => {
        const message = state.messagesByClientMessageId[clientMessageId];

        if (!message) return state;

        return {
          messagesByClientMessageId: {
            ...state.messagesByClientMessageId,
            [clientMessageId]: {
              ...message,
              status: "FAILED",
              failure,
            },
          },
        };
      }),

    removePendingMessage: (clientMessageId) =>
      set((state) => {
        const message = state.messagesByClientMessageId[clientMessageId];

        if (!message) return state;

        const messagesByClientMessageId = { ...state.messagesByClientMessageId };
        const clientMessageIdsByRoomId = { ...state.clientMessageIdsByRoomId };
        const remainingIds = (clientMessageIdsByRoomId[message.roomId] ?? []).filter(
          (id) => id !== clientMessageId,
        );

        delete messagesByClientMessageId[clientMessageId];

        if (remainingIds.length === 0) {
          delete clientMessageIdsByRoomId[message.roomId];
        } else {
          clientMessageIdsByRoomId[message.roomId] = remainingIds;
        }

        return { messagesByClientMessageId, clientMessageIdsByRoomId };
      }),

    removePendingMessagesByRoomId: (roomId) =>
      set((state) => {
        const clientMessageIds = state.clientMessageIdsByRoomId[roomId];

        if (!clientMessageIds) return state;

        const messagesByClientMessageId = { ...state.messagesByClientMessageId };
        const clientMessageIdsByRoomId = { ...state.clientMessageIdsByRoomId };

        clientMessageIds.forEach((clientMessageId) => {
          delete messagesByClientMessageId[clientMessageId];
        });
        delete clientMessageIdsByRoomId[roomId];

        return { messagesByClientMessageId, clientMessageIdsByRoomId };
      }),

    reset: () => set(createInitialState()),
  }),
);
