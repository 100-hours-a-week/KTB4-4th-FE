// 로그인된 보호 화면에서 익명대화 이벤트 분배와 WebSocket 연결 생명주기를 시작하는 컴포넌트
"use client";

import { useEffect } from "react";

import {
  startAnonymousChatEventDispatch,
  stopAnonymousChatEventDispatch,
} from "@/lib/websocket/anonymousChatEvents";
import {
  closeAnonymousChatSocket,
  openAnonymousChatSocket,
} from "@/lib/websocket/anonymousChatSocket";

export default function AnonymousChatSocketInitializer() {
  useEffect(() => {
    startAnonymousChatEventDispatch();
    openAnonymousChatSocket();

    return () => {
      stopAnonymousChatEventDispatch();
      void closeAnonymousChatSocket();
    };
  }, []);

  return null;
}
