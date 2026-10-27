// 익명 채팅 메시지를 입력해 전송하고 전송된 메시지를 채팅방에 전달하는 입력창
"use client";

import { useState } from "react";

import ChatComposer from "@/components/chat/ChatComposer";
import { sendAnonymousChatMessage, type AnonymousChatMessage } from "@/lib/api/anonymousChatRoom";

type AnonymousChatComposerProps = {
  chatId: number;
  onMessageSent: (message: AnonymousChatMessage) => void;
};

export default function AnonymousChatComposer({
  chatId,
  onMessageSent,
}: AnonymousChatComposerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async (content: string) => {
    setErrorMessage(null);

    try {
      const message = await sendAnonymousChatMessage(chatId, content);

      onMessageSent(message);
    } catch (error) {
      setErrorMessage("메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
      throw error;
    }
  };

  return (
    <div className="shrink-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {errorMessage && (
        <p role="alert" className="mb-2 text-caption text-danger">
          {errorMessage}
        </p>
      )}
      <ChatComposer onSend={handleSend} placeholder="메시지 입력" variant="anonymous" />
    </div>
  );
}
