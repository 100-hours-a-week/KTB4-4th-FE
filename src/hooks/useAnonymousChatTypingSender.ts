// 익명대화 입력 중 상태를 스로틀·디바운스해 상대방에게 전송하는 훅
"use client";

import { useCallback, useEffect, useRef } from "react";

import { publishAnonymousChatTyping } from "@/lib/websocket/anonymousChatSocket";

// 입력이 이어지는 동안 true를 다시 보내는 간격 (서버 제한: 10초에 10건)
const TYPING_THROTTLE_MS = 3_000;
// 마지막 입력 후 이 시간 동안 입력이 없으면 false 전송
const TYPING_IDLE_MS = 3_000;
// 상대방은 메시지 수신 후 1초간 true를 무시하므로, 메시지 전송 직후 입력은 이 시간이 지난 뒤 true 전송
// 메시지가 서버 저장을 거쳐 typing보다 늦게 도착할 수 있어 무시 시간보다 여유를 둠
const TYPING_DELAY_AFTER_MESSAGE_MS = 1_500;

export function useAnonymousChatTypingSender(roomId: number, isDisabled: boolean) {
  const isTypingRef = useRef(false);
  const lastSentAtRef = useRef(0);
  const lastMessageSentAtRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);
  const delayedStartTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (delayedStartTimerRef.current !== null) {
      window.clearTimeout(delayedStartTimerRef.current);
      delayedStartTimerRef.current = null;
    }
  }, []);

  const startTyping = useCallback(() => {
    if (delayedStartTimerRef.current !== null) {
      window.clearTimeout(delayedStartTimerRef.current);
      delayedStartTimerRef.current = null;
    }

    isTypingRef.current = true;
    lastSentAtRef.current = Date.now();
    publishAnonymousChatTyping(roomId, true);
  }, [roomId]);

  const stopTyping = useCallback(() => {
    clearTimers();

    if (!isTypingRef.current) return;

    isTypingRef.current = false;
    lastSentAtRef.current = 0;
    publishAnonymousChatTyping(roomId, false);
  }, [clearTimers, roomId]);

  const handleMessageSent = useCallback(() => {
    stopTyping();
    lastMessageSentAtRef.current = Date.now();
  }, [stopTyping]);

  const handleDraftChange = useCallback(
    (value: string) => {
      if (isDisabled || value.trim().length === 0) {
        stopTyping();
        return;
      }

      const now = Date.now();

      if (!isTypingRef.current) {
        const delayMs = lastMessageSentAtRef.current + TYPING_DELAY_AFTER_MESSAGE_MS - now;

        if (delayMs <= 0) {
          startTyping();
        } else if (delayedStartTimerRef.current === null) {
          delayedStartTimerRef.current = window.setTimeout(startTyping, delayMs);
        }
      } else if (now - lastSentAtRef.current >= TYPING_THROTTLE_MS) {
        startTyping();
      }

      // 예약된 true가 나가기 전에 입력이 멈추면 stopTyping이 예약도 함께 취소함
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(stopTyping, TYPING_IDLE_MS);
    },
    [isDisabled, startTyping, stopTyping],
  );

  // 방 전환·화면 이탈·대화 종료 시 상대방 화면에 입력 중 표시가 남지 않도록 즉시 false 전송
  useEffect(() => {
    if (isDisabled) stopTyping();

    return stopTyping;
  }, [isDisabled, stopTyping]);

  return { handleDraftChange, handleMessageSent };
}
