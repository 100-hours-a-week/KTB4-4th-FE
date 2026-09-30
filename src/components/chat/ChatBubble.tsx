// 발신자에 따라 정렬과 색상을 구분하는 AI 대화 말풍선 컴포넌트

import Image from "next/image";

import type { ChatMessage } from "@/types/chat";

type ChatBubbleProps = {
  message: ChatMessage;
};

// TODO: 추후 다른 AI 채팅 모달에서도 ChatBubble 컴포넌트 재사용
export default function ChatBubble({ message }: ChatBubbleProps) {
  const isAssistant = message.role === "ASSISTANT";

  return (
    <article
      aria-label={`${message.senderName}의 메시지`}
      className={`flex w-full items-center gap-3 ${isAssistant ? "pr-6" : "justify-end pl-12"}`}
    >
      {isAssistant && (
        <Image
          src="/images/Needu_profile.png"
          alt="니쥬 프로필"
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 object-contain"
        />
      )}

      <div
        className={`min-w-0 rounded-md p-4 ${
          isAssistant ? "max-w-[calc(100%-3.75rem)] bg-surface" : "max-w-[85%] bg-primary"
        }`}
      >
        {isAssistant && (
          <p className="text-body-sm font-bold text-foreground">{message.senderName}</p>
        )}
        <p
          className={`wrap-anywhere whitespace-pre-line text-body text-foreground ${isAssistant ? "mt-2" : ""}`}
        >
          {message.content}
        </p>
      </div>
    </article>
  );
}
