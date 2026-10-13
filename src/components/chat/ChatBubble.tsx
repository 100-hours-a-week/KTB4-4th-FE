// 발신자에 따라 정렬과 색상을 구분하는 AI 대화 말풍선 컴포넌트

import Image from "next/image";

import type { ChatMessage, ChatMessageId } from "@/types/chat";

import styles from "./ChatBubble.module.css";

type ChatBubbleProps = {
  message: ChatMessage;
  onRetryMessage: (messageId: ChatMessageId) => void;
  onCancelMessage: (messageId: ChatMessageId) => void;
};

// TODO: 추후 다른 AI 채팅 모달에서도 ChatBubble 컴포넌트 재사용
export default function ChatBubble({ message, onRetryMessage, onCancelMessage }: ChatBubbleProps) {
  const isAssistant = message.role === "ASSISTANT";
  const isFailed = message.deliveryStatus === "FAILED";
  const isRetrying = message.deliveryStatus === "RETRYING";
  const isCanceled = message.deliveryStatus === "CANCELED";
  const hasDeliveryAction = !isAssistant && (isFailed || isRetrying);

  return (
    <article
      aria-label={`${message.senderName}의 메시지${isCanceled ? ", 전송 취소됨" : ""}`}
      aria-busy={isRetrying || undefined}
      className={`flex w-full items-center gap-3 ${
        isAssistant ? "pr-6" : `justify-end ${hasDeliveryAction || isCanceled ? "" : "pl-12"}`
      }`}
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

      {hasDeliveryAction && (
        <div className="flex shrink-0 self-center" aria-label="메시지 전송 작업">
          {isRetrying ? (
            <span
              role="status"
              aria-label="메시지 재전송 중"
              className="flex h-7 w-7 items-center justify-center text-muted"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 animate-spin"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="opacity-25"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          ) : (
            <div
              role="group"
              aria-label="실패한 메시지 작업"
              className={`${styles.actionGroup} flex items-center justify-center overflow-hidden rounded-md border border-border-strong`}
            >
              <button
                type="button"
                aria-label="메시지 재전송"
                title="재전송"
                onClick={() => onRetryMessage(message.id)}
                className={`${styles.compactActionButton} flex h-7 w-7 cursor-pointer items-center justify-center border-0 bg-transparent text-muted transition-colors hover:bg-surface/60 hover:text-foreground focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-3.36-7.02" />
                  <path d="M21 3v6h-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="메시지 전송 취소"
                title="취소"
                onClick={() => onCancelMessage(message.id)}
                className={`${styles.compactActionButton} flex h-7 w-7 cursor-pointer items-center justify-center border-0 border-l border-border-strong bg-transparent text-danger transition-colors hover:bg-surface/60 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-danger`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="m7 7 10 10M17 7 7 17" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <div
        className={`min-w-0 rounded-md ${
          isAssistant
            ? "max-w-[calc(100%-3.75rem)] bg-surface p-4"
            : hasDeliveryAction
              ? `${isRetrying ? "max-w-[calc(100%-2.5rem)]" : "max-w-[calc(100%-4.25rem)]"} bg-primary p-4`
              : isCanceled
                ? "w-full border border-border-strong bg-background-subtle px-4 py-1"
                : "max-w-[85%] bg-primary p-4"
        }`}
      >
        {isAssistant && (
          <p className="text-body-sm font-bold text-foreground">{message.senderName}</p>
        )}
        {isCanceled ? (
          <p role="status" className="whitespace-nowrap text-center text-body-sm text-muted">
            메시지 전송이 취소되었어요.
          </p>
        ) : (
          <p
            className={`wrap-anywhere whitespace-pre-line text-body text-foreground ${isAssistant ? "mt-2" : ""}`}
          >
            {message.content}
          </p>
        )}
      </div>
    </article>
  );
}
