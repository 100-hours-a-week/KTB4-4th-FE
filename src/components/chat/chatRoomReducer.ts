// AI 대화방의 메시지 목록, 답변 대기 여부, 메시지 전송 오류 상태를 관리하는 reducer

import type { ChatMessage, ChatMessageId } from "@/types/chat";

export type MessageSendError = {
  messageId: ChatMessageId;
  status: number;
  retryAfterSeconds: number;
};

export type ChatRoomState = {
  messages: ChatMessage[];
  isAwaitingResponse: boolean;
  sendError: MessageSendError | null;
};

export type ChatRoomAction =
  | { type: "SEND_STARTED"; message: ChatMessage }
  | {
      type: "SEND_SUCCEEDED";
      clientMessageId: string;
      userMessageId: number;
      assistantMessage: ChatMessage;
    }
  | { type: "SEND_FAILED"; clientMessageId: string; error: MessageSendError }
  | { type: "RESPONSE_WAIT_ENDED" }
  | { type: "RETRY_STARTED"; messageId: ChatMessageId }
  | { type: "RETRY_SUCCEEDED"; messageId: ChatMessageId }
  | { type: "MESSAGE_CANCELED"; messageId: ChatMessageId }
  | { type: "SEND_ERROR_RETRY_TICKED" }
  | { type: "SEND_ERROR_CLEARED" };

export const createChatRoomState = (initialMessages: ChatMessage[]): ChatRoomState => ({
  messages: initialMessages,
  isAwaitingResponse: false,
  sendError: null,
});

const clearSendErrorFor = (sendError: MessageSendError | null, messageId: ChatMessageId) =>
  sendError?.messageId === messageId ? null : sendError;

export const chatRoomReducer = (state: ChatRoomState, action: ChatRoomAction): ChatRoomState => {
  switch (action.type) {
    case "SEND_STARTED":
      return {
        ...state,
        messages: [...state.messages, action.message],
        isAwaitingResponse: true,
      };
    case "SEND_SUCCEEDED":
      return {
        ...state,
        messages: [
          ...state.messages.map((message) =>
            message.id === action.clientMessageId
              ? { ...message, id: action.userMessageId }
              : message,
          ),
          action.assistantMessage,
        ],
        sendError: null,
      };
    case "SEND_FAILED":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.clientMessageId
            ? { ...message, deliveryStatus: "FAILED" }
            : message,
        ),
        sendError: action.error,
      };
    case "RESPONSE_WAIT_ENDED":
      return { ...state, isAwaitingResponse: false };
    case "RETRY_STARTED":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId && message.deliveryStatus === "FAILED"
            ? { ...message, deliveryStatus: "RETRYING" }
            : message,
        ),
      };
    case "RETRY_SUCCEEDED":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId && message.deliveryStatus === "RETRYING"
            ? { ...message, deliveryStatus: "SENT" }
            : message,
        ),
        sendError: clearSendErrorFor(state.sendError, action.messageId),
      };
    case "MESSAGE_CANCELED":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId && message.deliveryStatus === "FAILED"
            ? { ...message, deliveryStatus: "CANCELED" }
            : message,
        ),
        sendError: clearSendErrorFor(state.sendError, action.messageId),
      };
    case "SEND_ERROR_RETRY_TICKED":
      return state.sendError?.status === 429
        ? {
            ...state,
            sendError: {
              ...state.sendError,
              retryAfterSeconds: Math.max(0, state.sendError.retryAfterSeconds - 1),
            },
          }
        : state;
    case "SEND_ERROR_CLEARED":
      return { ...state, sendError: null };
  }
};
