// AI와 사용자의 대화 메시지를 순서대로 표시하는 목록 컴포넌트

import ChatBubble from "@/components/chat/ChatBubble";
import type { ChatMessage } from "@/types/chat";

import styles from "./ChatMessageList.module.css";

import type { Ref } from "react";

type ChatMessageListProps = {
  messages: ChatMessage[];
  ref?: Ref<HTMLElement>;
};

export default function ChatMessageList({ messages, ref }: ChatMessageListProps) {
  return (
    <section
      ref={ref}
      aria-label="AI 대화 메시지"
      aria-live="polite"
      className={`${styles.messageList} flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto py-5 pr-3`}
    >
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
    </section>
  );
}
