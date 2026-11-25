// 열린 익명대화방의 상대방 입력 중 이벤트를 받아 표시 여부를 관리하는 훅
"use client";

import { useEffect, useState } from "react";

import {
  addAnonymousChatEventHandler,
  type AnonymousChatEvent,
} from "@/lib/websocket/anonymousChatEvents";
import { useAnonymousChatStore } from "@/stores/anonymousChatStore";

// false가 유실돼도 표시가 남지 않도록 마지막 true 이후 자동으로 숨기는 시간 (송신 간격 3초보다 길게)
const TYPING_EXPIRE_MS = 5_000;
// 메시지보다 늦게 도착한 true로 표시가 다시 뜨지 않도록 메시지 수신 직후 true를 무시하는 시간
const TYPING_IGNORE_AFTER_MESSAGE_MS = 1_000;

export function useAnonymousChatTypingReceiver(roomId: number) {
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);
  const isConnected = useAnonymousChatStore((state) => state.connectionStatus === "connected");

  useEffect(() => {
    let expireTimer: number | null = null;
    let ignoreTrueUntil = 0;

    const hide = () => {
      if (expireTimer !== null) {
        window.clearTimeout(expireTimer);
        expireTimer = null;
      }

      setIsCounterpartTyping(false);
    };

    const handleEvent = (event: AnonymousChatEvent) => {
      if (event.type === "ANONYMOUS_CHAT_TYPING" && event.data.roomId === roomId) {
        if (!event.data.isTyping) {
          hide();
          return;
        }

        if (Date.now() < ignoreTrueUntil) return;

        if (expireTimer !== null) window.clearTimeout(expireTimer);
        expireTimer = window.setTimeout(hide, TYPING_EXPIRE_MS);
        setIsCounterpartTyping(true);
        return;
      }

      if (event.type === "ANONYMOUS_CHAT_MESSAGE_RECEIVED" && event.data.roomId === roomId) {
        ignoreTrueUntil = Date.now() + TYPING_IGNORE_AFTER_MESSAGE_MS;
        hide();
        return;
      }

      if (event.type === "ANONYMOUS_CHAT_ROOM_ENDED" && event.data.roomId === roomId) {
        hide();
      }
    };

    const removeHandler = addAnonymousChatEventHandler(handleEvent);

    return () => {
      removeHandler();
      hide();
    };
  }, [roomId]);

  // 연결이 끊기면 false를 받을 수 없으므로 표시를 바로 숨김
  return isConnected && isCounterpartTyping;
}
