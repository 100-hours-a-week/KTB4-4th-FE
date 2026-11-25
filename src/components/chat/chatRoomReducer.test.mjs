// AI 답변 재발행 시 대화방 상태 전환 검증

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { chatRoomReducer, createChatRoomState } from "./chatRoomReducer.ts";

const CLIENT_MESSAGE_ID = "client-message-id";
const USER_MESSAGE_ID = 680;

function createAcceptedTurn(attempt = 1) {
  const startedState = chatRoomReducer(createChatRoomState([]), {
    type: "SEND_STARTED",
    clientMessageId: CLIENT_MESSAGE_ID,
    content: "질문",
  });

  return chatRoomReducer(startedState, {
    type: "SEND_ACCEPTED",
    clientMessageId: CLIENT_MESSAGE_ID,
    userMessageId: USER_MESSAGE_ID,
    attempt,
  });
}

function displayDelta(state, { attempt, index, text }) {
  return chatRoomReducer(state, {
    type: "DELTA_TOKEN_DISPLAYED",
    userMessageId: USER_MESSAGE_ID,
    attempt,
    index,
    text,
    isChunkEnd: true,
  });
}

function getAssistantMessage(state) {
  return state.messages.find((message) => message.role === "ASSISTANT");
}

describe("chatRoomReducer AI 답변 재발행", () => {
  it("더 큰 attempt의 accepted가 오면 임시 답변과 델타 상태를 초기화한다", () => {
    const stateWithDelta = displayDelta(createAcceptedTurn(), {
      attempt: 1,
      index: 0,
      text: "기존 답변",
    });
    const stateWithMissingDelta = displayDelta(stateWithDelta, {
      attempt: 1,
      index: 2,
      text: "누락 이후 답변",
    });

    const republishedState = chatRoomReducer(stateWithMissingDelta, {
      type: "SEND_ACCEPTED",
      clientMessageId: CLIENT_MESSAGE_ID,
      userMessageId: USER_MESSAGE_ID,
      attempt: 2,
    });

    assert.equal(getAssistantMessage(republishedState)?.content, "");
    assert.equal(republishedState.turn?.attempt, 2);
    assert.equal(republishedState.turn?.nextDeltaIndex, 0);
    assert.equal(republishedState.turn?.hasMissingDelta, false);
  });

  it("현재 턴보다 작은 attempt의 accepted와 delta를 무시한다", () => {
    const currentState = displayDelta(createAcceptedTurn(2), {
      attempt: 2,
      index: 0,
      text: "현재 답변",
    });

    const staleAcceptedState = chatRoomReducer(currentState, {
      type: "SEND_ACCEPTED",
      clientMessageId: CLIENT_MESSAGE_ID,
      userMessageId: USER_MESSAGE_ID,
      attempt: 1,
    });
    const staleDeltaState = displayDelta(staleAcceptedState, {
      attempt: 1,
      index: 1,
      text: "이전 답변",
    });

    assert.strictEqual(staleAcceptedState, currentState);
    assert.strictEqual(staleDeltaState, currentState);
    assert.equal(getAssistantMessage(staleDeltaState)?.content, "현재 답변");
  });

  it("현재 턴과 다른 attempt의 error를 무시한다", () => {
    const currentState = displayDelta(createAcceptedTurn(2), {
      attempt: 2,
      index: 0,
      text: "현재 답변",
    });

    const staleErrorState = chatRoomReducer(currentState, {
      type: "TURN_FAILED",
      userMessageId: USER_MESSAGE_ID,
      attempt: 1,
      message: "이전 시도 오류",
      retryable: false,
    });

    assert.strictEqual(staleErrorState, currentState);
    assert.equal(staleErrorState.turn?.isFailed, false);
    assert.equal(getAssistantMessage(staleErrorState)?.content, "현재 답변");
  });

  it("attempt가 없는 delta와 error는 기존 방식으로 처리한다", () => {
    const stateWithDelta = displayDelta(createAcceptedTurn(2), {
      attempt: undefined,
      index: 0,
      text: "레거시 답변",
    });

    assert.equal(getAssistantMessage(stateWithDelta)?.content, "레거시 답변");
    assert.equal(stateWithDelta.turn?.nextDeltaIndex, 1);

    const failedState = chatRoomReducer(stateWithDelta, {
      type: "TURN_FAILED",
      userMessageId: USER_MESSAGE_ID,
      message: "레거시 오류",
      retryable: false,
    });

    assert.equal(failedState.turn?.isFailed, true);
    assert.equal(failedState.turnErrorMessage, "레거시 오류");
  });
});
