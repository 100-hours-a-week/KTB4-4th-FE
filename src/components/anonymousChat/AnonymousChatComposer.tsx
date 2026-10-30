// 익명대화 메시지 입력과 WebSocket 전송을 담당하는 입력창 컴포넌트
"use client";

import { useState } from "react";

import ChatComposer from "@/components/chat/ChatComposer";
import { sendAnonymousChatMessage } from "@/lib/websocket/anonymousChatMessageDelivery";

type AnonymousChatComposerProps = {
  chatId: number;
  isDisabled?: boolean;
};

export default function AnonymousChatComposer({
  chatId,
  isDisabled = false,
}: AnonymousChatComposerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async (content: string) => {
    setErrorMessage(null);

    try {
      sendAnonymousChatMessage({ roomId: chatId, content });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    }
  };

  return (
    <div className="shrink-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {errorMessage && (
        <p role="alert" className="mb-2 text-caption text-danger">
          {errorMessage}
        </p>
      )}
      <ChatComposer
        onSend={handleSend}
        isDisabled={isDisabled}
        placeholder="메시지 입력"
        variant="anonymous"
        trimBeforeSend={false}
      />
    </div>
  );
}
