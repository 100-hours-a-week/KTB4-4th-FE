// AI 대화방의 메시지 목록, 답변 대기 여부, 메시지 전송 오류와 스트리밍 중인 턴 상태를 관리하는 reducer

import type { ChatMessage, ChatMessageId } from "@/types/chat";

export type MessageSendError = {
  messageId: ChatMessageId;
  status: number;
  retryAfterSeconds: number;
};

// 메시지를 보낸 뒤 done을 받을 때까지 진행 중인 한 턴
export type ChatTurn = {
  clientMessageId: string;
  // 202 응답이나 accepted 이벤트 중 먼저 온 쪽에서 채워짐
  userMessageId: number | null;
  // completed 전까지 조각을 이어 붙이는 임시 AI 메시지 ID
  assistantMessageId: string;
  nextDeltaIndex: number;
  // 빈 번호가 생기면 이후 조각은 버리고 completed.content로 통째로 바꿈
  hasMissingDelta: boolean;
  isCompleted: boolean;
  isFailed: boolean;
};

export type ChatRoomState = {
  messages: ChatMessage[];
  isAwaitingResponse: boolean;
  sendError: MessageSendError | null;
  // 재시도해도 해결되지 않는 답변 생성 실패 안내 문구
  turnErrorMessage: string | null;
  turn: ChatTurn | null;
};

export type ChatRoomAction =
  | { type: "SEND_STARTED"; clientMessageId: string; content: string }
  | { type: "RETRY_STARTED"; clientMessageId: string }
  | { type: "SEND_ACCEPTED"; clientMessageId: string; userMessageId: number }
  | { type: "SEND_FAILED"; clientMessageId: string; status: number; retryAfterSeconds: number }
  | { type: "DELTA_RECEIVED"; userMessageId: number; index: number; text: string }
  | { type: "TURN_COMPLETED"; userMessageId: number; messageId: number; content: string }
  | { type: "TURN_FAILED"; userMessageId: number; message: string; retryable: boolean }
  | { type: "TURN_DONE"; userMessageId: number }
  | { type: "TURN_ABORTED" }
  | { type: "MESSAGE_CANCELED"; messageId: ChatMessageId }
  | { type: "SEND_ERROR_RETRY_TICKED" }
  | { type: "SEND_ERROR_CLEARED" };

const ASSISTANT_SENDER_NAME = "니쥬";
const USER_SENDER_NAME = "나";

export const createChatRoomState = (initialMessages: ChatMessage[]): ChatRoomState => ({
  messages: initialMessages,
  isAwaitingResponse: false,
  sendError: null,
  turnErrorMessage: null,
  turn: null,
});

const createTurn = (clientMessageId: string): ChatTurn => ({
  clientMessageId,
  userMessageId: null,
  assistantMessageId: `assistant-${clientMessageId}`,
  nextDeltaIndex: 0,
  hasMissingDelta: false,
  isCompleted: false,
  isFailed: false,
});

const clearSendErrorFor = (sendError: MessageSendError | null, messageId: ChatMessageId) =>
  sendError?.messageId === messageId ? null : sendError;

const isCurrentTurn = (turn: ChatTurn | null, userMessageId: number): turn is ChatTurn =>
  turn?.userMessageId === userMessageId;

const removeMessage = (messages: ChatMessage[], messageId: ChatMessageId) =>
  messages.filter((message) => message.id !== messageId);

export const chatRoomReducer = (state: ChatRoomState, action: ChatRoomAction): ChatRoomState => {
  switch (action.type) {
    case "SEND_STARTED":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.clientMessageId,
            role: "USER",
            senderName: USER_SENDER_NAME,
            content: action.content,
            deliveryStatus: "SENT",
            clientMessageId: action.clientMessageId,
          },
        ],
        isAwaitingResponse: true,
        turnErrorMessage: null,
        turn: createTurn(action.clientMessageId),
      };
    case "RETRY_STARTED": {
      // 재전송하면 이미 받은 조각은 버리고 index 0부터 새로 받음
      const retryingMessage = state.messages.find(
        (message) =>
          message.clientMessageId === action.clientMessageId && message.deliveryStatus === "FAILED",
      );

      if (!retryingMessage) return state;

      return {
        ...state,
        messages: state.messages.map((message) =>
          message === retryingMessage ? { ...message, deliveryStatus: "RETRYING" } : message,
        ),
        isAwaitingResponse: true,
        sendError: clearSendErrorFor(state.sendError, retryingMessage.id),
        turnErrorMessage: null,
        turn: createTurn(action.clientMessageId),
      };
    }
    case "SEND_ACCEPTED": {
      // 202 응답과 accepted 이벤트는 순서가 바뀌어 올 수 있으므로 먼저 온 쪽만 반영함
      const { turn } = state;

      if (turn?.clientMessageId !== action.clientMessageId || turn.userMessageId !== null) {
        return state;
      }

      return {
        ...state,
        messages: state.messages.map((message) =>
          message.clientMessageId === action.clientMessageId
            ? { ...message, id: action.userMessageId, deliveryStatus: "SENT" }
            : message,
        ),
        sendError: null,
        turn: { ...turn, userMessageId: action.userMessageId },
      };
    }
    case "SEND_FAILED": {
      const failedMessage = state.messages.find(
        (message) => message.clientMessageId === action.clientMessageId,
      );

      return {
        ...state,
        messages: state.messages.map((message) =>
          message === failedMessage ? { ...message, deliveryStatus: "FAILED" } : message,
        ),
        isAwaitingResponse: false,
        sendError: failedMessage
          ? {
              messageId: failedMessage.id,
              status: action.status,
              retryAfterSeconds: action.retryAfterSeconds,
            }
          : state.sendError,
        turn: null,
      };
    }
    case "DELTA_RECEIVED": {
      const { turn } = state;

      if (
        !isCurrentTurn(turn, action.userMessageId) ||
        turn.isCompleted ||
        turn.isFailed ||
        turn.hasMissingDelta
      ) {
        return state;
      }

      if (action.index !== turn.nextDeltaIndex) {
        return { ...state, turn: { ...turn, hasMissingDelta: true } };
      }

      const hasAssistantMessage = state.messages.some(
        (message) => message.id === turn.assistantMessageId,
      );

      return {
        ...state,
        messages: hasAssistantMessage
          ? state.messages.map((message) =>
              message.id === turn.assistantMessageId
                ? { ...message, content: message.content + action.text }
                : message,
            )
          : [
              ...state.messages,
              {
                id: turn.assistantMessageId,
                role: "ASSISTANT",
                senderName: ASSISTANT_SENDER_NAME,
                content: action.text,
                deliveryStatus: "SENT",
              },
            ],
        isAwaitingResponse: false,
        turn: { ...turn, nextDeltaIndex: turn.nextDeltaIndex + 1 },
      };
    }
    case "TURN_COMPLETED": {
      const { turn } = state;

      if (!isCurrentTurn(turn, action.userMessageId) || turn.isCompleted) {
        return state;
      }

      // 조각을 이어 붙인 값과 최종 답변이 다를 수 있으므로 항상 completed.content로 바꿈
      const assistantMessage: ChatMessage = {
        id: action.messageId,
        role: "ASSISTANT",
        senderName: ASSISTANT_SENDER_NAME,
        content: action.content,
        deliveryStatus: "SENT",
      };

      return {
        ...state,
        messages: [...removeMessage(state.messages, turn.assistantMessageId), assistantMessage],
        isAwaitingResponse: false,
        sendError: null,
        turn: { ...turn, isCompleted: true },
      };
    }
    case "TURN_FAILED": {
      const { turn } = state;

      if (!isCurrentTurn(turn, action.userMessageId) || turn.isCompleted || turn.isFailed) {
        return state;
      }

      // 재시도 가능하면 사용자 메시지에 재전송 버튼을 보이고, 아니면 입력창 위에 문구만 표시함
      return {
        ...state,
        messages: removeMessage(state.messages, turn.assistantMessageId).map((message) =>
          action.retryable && message.id === action.userMessageId
            ? { ...message, deliveryStatus: "FAILED" }
            : message,
        ),
        isAwaitingResponse: false,
        turnErrorMessage: action.retryable ? null : action.message,
        turn: { ...turn, isFailed: true },
      };
    }
    case "TURN_DONE": {
      const { turn } = state;

      if (!isCurrentTurn(turn, action.userMessageId)) {
        return state;
      }

      // completed 없이 끝난 턴의 조각은 저장되지 않은 답변이므로 지움
      return {
        ...state,
        messages: turn.isCompleted
          ? state.messages
          : removeMessage(state.messages, turn.assistantMessageId),
        isAwaitingResponse: false,
        turn: null,
      };
    }
    case "TURN_ABORTED":
      return { ...state, isAwaitingResponse: false, turn: null };
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
