// 로그인된 보호 화면에서 익명대화 이벤트 분배와 WebSocket 연결 생명주기를 시작하는 컴포넌트
"use client";

import { useEffect } from "react";

import { syncAnonymousChatUnreadState } from "@/lib/anonymousChatUnreadSync";
import {
  startAnonymousChatEventDispatch,
  stopAnonymousChatEventDispatch,
} from "@/lib/websocket/anonymousChatEvents";
import { resetAnonymousChatMessageDelivery } from "@/lib/websocket/anonymousChatMessageDelivery";
import {
  closeAnonymousChatSocket,
  openAnonymousChatSocket,
} from "@/lib/websocket/anonymousChatSocket";

export default function AnonymousChatSocketInitializer() {
  useEffect(() => {
    const requestController = new AbortController();

    startAnonymousChatEventDispatch();
    openAnonymousChatSocket();
    void syncAnonymousChatUnreadState(requestController.signal).catch((error) => {
      if (error instanceof Error && error.name === "AbortError") return;

      // 연결은 유지해 이후 실시간 unread를 반영하고 초기 동기화 실패만 기록함
      console.error("익명대화 읽지 않은 메시지 상태를 초기화하지 못했습니다.", error);
    });

    return () => {
      requestController.abort();
      stopAnonymousChatEventDispatch();
      resetAnonymousChatMessageDelivery();
      void closeAnonymousChatSocket();
    };
  }, []);

  return null;
}
