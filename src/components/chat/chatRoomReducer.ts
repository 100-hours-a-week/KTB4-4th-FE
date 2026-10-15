// AI 대화방의 메시지 목록, 답변 대기 여부, 메시지 전송 오류, 스트리밍 중인 턴과 목록 재조회 상태를 관리하는 reducer

import type { AiConversationMessage } from "@/lib/api/aiConversationMessages";
import type { ChatMessage, ChatMessageId } from "@/types/chat";

export type MessageSendError = {
  messageId: ChatMessageId;
  status: number;
  retryAfterSeconds: number;
};

// LOCAL: 이 화면에서 보낸 턴, RESUMED: 진입·재연결 시 이미 생성 중이던 턴, EXTERNAL: 다른 탭에서 보낸 턴
export type ChatTurnKind = "LOCAL" | "RESUMED" | "EXTERNAL";

// 메시지를 보낸 뒤 done을 받을 때까지 진행 중인 한 턴
export type ChatTurn = {
  kind: ChatTurnKind;
  // LOCAL 턴만 가지며 202 응답과 accepted 이벤트를 같은 메시지로 연결할 때 사용함
  clientMessageId: string | null;
  // 202 응답이나 accepted 이벤트 중 먼저 온 쪽에서 채워짐
  userMessageId: number | null;
  // completed 전까지 조각을 이어 붙이는 임시 AI 메시지 ID
  assistantMessageId: string;
  // null이면 생성 도중 들어온 턴이라 처음 받은 조각의 번호부터 이어 붙임
  nextDeltaIndex: number | null;
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
  // 재연결이나 다른 탭의 턴으로 놓친 메시지가 있어 목록을 다시 조회해야 하는지 여부
  needsMessageSync: boolean;
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
  | {
      type: "STREAM_CONNECTED";
      generating: boolean;
      pendingUserMessageId: number | null;
      isReconnected: boolean;
    }
  | { type: "MESSAGES_SYNCED"; messages: ChatMessage[] }
  | { type: "MESSAGES_SYNC_FAILED" }
  | { type: "MESSAGE_CANCELED"; messageId: ChatMessageId }
  | { type: "SEND_ERROR_RETRY_TICKED" }
  | { type: "SEND_ERROR_CLEARED" };

const ASSISTANT_SENDER_NAME = "니쥬";
const USER_SENDER_NAME = "나";

export function toChatMessage(message: AiConversationMessage): ChatMessage {
  const isAiMessage = message.role === "AI";

  return {
    id: message.messageId,
    role: isAiMessage ? "ASSISTANT" : "USER",
    senderName: isAiMessage ? ASSISTANT_SENDER_NAME : USER_SENDER_NAME,
    content: message.content,
    deliveryStatus: "SENT",
  };
}

export const createChatRoomState = (initialMessages: ChatMessage[]): ChatRoomState => ({
  messages: initialMessages,
  isAwaitingResponse: false,
  sendError: null,
  turnErrorMessage: null,
  turn: null,
  needsMessageSync: false,
});

const createTurn = (clientMessageId: string): ChatTurn => ({
  kind: "LOCAL",
  clientMessageId,
  userMessageId: null,
  assistantMessageId: `assistant-${clientMessageId}`,
  nextDeltaIndex: 0,
  hasMissingDelta: false,
  isCompleted: false,
  isFailed: false,
});

const createServerTurn = (kind: "RESUMED" | "EXTERNAL", userMessageId: number): ChatTurn => ({
  kind,
  clientMessageId: null,
  userMessageId,
  assistantMessageId: `assistant-${userMessageId}`,
  nextDeltaIndex: null,
  hasMissingDelta: false,
  isCompleted: false,
  isFailed: false,
});

// 서버 목록에 없는 이 화면의 미전송 메시지(전송 실패·취소)는 목록을 다시 받아도 유지함
const mergeWithUnsentMessages = (serverMessages: ChatMessage[], messages: ChatMessage[]) => [
  ...serverMessages,
  ...messages.filter((message) => typeof message.id === "string" && message.role === "USER"),
];

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

      // 진행 중인 턴이 없는데 접수 이벤트가 오면 다른 탭에서 보낸 메시지이므로 끝날 때까지 입력만 막음
      if (turn === null) {
        return { ...state, turn: createServerTurn("EXTERNAL", action.userMessageId) };
      }

      if (turn.clientMessageId !== action.clientMessageId || turn.userMessageId !== null) {
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
        turn.kind === "EXTERNAL" ||
        turn.isCompleted ||
        turn.isFailed ||
        turn.hasMissingDelta
      ) {
        return state;
      }

      if (turn.nextDeltaIndex !== null && action.index !== turn.nextDeltaIndex) {
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
        turn: { ...turn, nextDeltaIndex: action.index + 1 },
      };
    }
    case "TURN_COMPLETED": {
      const { turn } = state;

      if (!isCurrentTurn(turn, action.userMessageId) || turn.isCompleted) {
        return state;
      }

      // 다른 탭의 답변은 사용자 메시지가 없어 표시하지 않고 done 이후 목록으로 받아옴
      if (turn.kind === "EXTERNAL") {
        return { ...state, turn: { ...turn, isCompleted: true } };
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

      if (turn.kind === "EXTERNAL") {
        return { ...state, turn: { ...turn, isFailed: true } };
      }

      // 재전송에는 clientMessageId가 필요하므로 이 화면에서 보낸 메시지만 재전송 버튼을 보이고,
      // 그 밖의 경우는 입력창 위에 문구만 표시함
      const canRetry = action.retryable && turn.kind === "LOCAL";

      return {
        ...state,
        messages: removeMessage(state.messages, turn.assistantMessageId).map((message) =>
          canRetry && message.id === action.userMessageId
            ? { ...message, deliveryStatus: "FAILED" }
            : message,
        ),
        isAwaitingResponse: false,
        turnErrorMessage: canRetry ? null : action.message,
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
        needsMessageSync: state.needsMessageSync || turn.kind === "EXTERNAL",
      };
    }
    case "TURN_ABORTED":
      return { ...state, isAwaitingResponse: false, turn: null };
    case "STREAM_CONNECTED": {
      const { turn } = state;

      // 전송 요청의 응답을 기다리는 중이면 접수 결과로 턴이 이어지므로 그대로 둠
      if (turn?.kind === "LOCAL" && turn.userMessageId === null) {
        return state;
      }

      // 답변이 생성 중이면 입력을 막고 이어서 오는 조각부터 표시함
      if (action.generating && action.pendingUserMessageId !== null) {
        if (turn?.userMessageId === action.pendingUserMessageId) {
          return state;
        }

        return {
          ...state,
          isAwaitingResponse: true,
          turn: createServerTurn("RESUMED", action.pendingUserMessageId),
        };
      }

      if (!action.isReconnected) {
        return state;
      }

      // 끊긴 사이 끝난 답변은 메시지 목록으로 복구함
      return {
        ...state,
        messages: turn ? removeMessage(state.messages, turn.assistantMessageId) : state.messages,
        isAwaitingResponse: false,
        turn: null,
        needsMessageSync: true,
      };
    }
    case "MESSAGES_SYNCED":
      // 목록을 받는 사이 새 턴이 시작됐으면 그 턴이 끝난 뒤 다시 조회함
      if (state.turn !== null) {
        return state;
      }

      return {
        ...state,
        messages: mergeWithUnsentMessages(action.messages, state.messages),
        needsMessageSync: false,
      };
    case "MESSAGES_SYNC_FAILED":
      return { ...state, needsMessageSync: false };
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
