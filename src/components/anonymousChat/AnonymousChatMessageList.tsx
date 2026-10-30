// 서버·전송 대기 메시지를 날짜 구분선과 함께 표시하고 스크롤 위치를 관리하는 목록
"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { AnonymousChatMessage } from "@/lib/api/anonymousChatRoom";
import {
  formatChatDateDivider,
  formatChatMessageTime,
  getChatMessageDateKey,
} from "@/lib/formatChatMessageTime";
import type {
  AnonymousChatPendingMessage,
  AnonymousChatPendingMessageFailure,
} from "@/stores/anonymousChatPendingMessageStore";

import styles from "./AnonymousChatList.module.css";

type AnonymousChatMessageListProps = {
  counterpartName: string;
  messages: AnonymousChatMessage[];
  pendingMessages: AnonymousChatPendingMessage[];
  hasNext: boolean;
  isLoadingPreviousMessages: boolean;
  previousMessagesError: {
    message: string;
    retryAfterSeconds: number;
    canRetry: boolean;
  } | null;
  onLoadPreviousMessages: () => Promise<void>;
  onLastVisibleCounterpartMessageChange: (messageId: number) => void;
  onRetryMessage: (clientMessageId: string) => void;
};

type ConfirmedDisplayMessage = AnonymousChatMessage & {
  key: string;
  deliveryStatus: "SENT";
  failure: null;
};

type PendingDisplayMessage = {
  key: string;
  messageId: null;
  clientMessageId: string;
  content: string;
  isMine: true;
  unreadCount: 0;
  sentAt: string;
  deliveryStatus: "SENDING" | "FAILED";
  failure: AnonymousChatPendingMessageFailure | null;
};

type AnonymousChatDisplayMessage = ConfirmedDisplayMessage | PendingDisplayMessage;

const LOAD_PREVIOUS_SCROLL_THRESHOLD_PX = 80;

function createDisplayMessages(
  messages: AnonymousChatMessage[],
  pendingMessages: AnonymousChatPendingMessage[],
) {
  const confirmedClientMessageIds = new Set(
    messages.flatMap((message) => (message.clientMessageId ? [message.clientMessageId] : [])),
  );
  const displayMessages: AnonymousChatDisplayMessage[] = [
    ...messages.map((message): ConfirmedDisplayMessage => ({
      ...message,
      key: `message-${message.messageId}`,
      deliveryStatus: "SENT",
      failure: null,
    })),
    ...pendingMessages
      .filter((message) => !confirmedClientMessageIds.has(message.clientMessageId))
      .map((message): PendingDisplayMessage => ({
        key: `pending-${message.clientMessageId}`,
        messageId: null,
        clientMessageId: message.clientMessageId,
        content: message.content,
        isMine: true,
        unreadCount: 0,
        sentAt: message.sentAt,
        deliveryStatus: message.status,
        failure: message.failure,
      })),
  ];

  return displayMessages.sort((left, right) => {
    const timeDifference = Date.parse(left.sentAt) - Date.parse(right.sentAt);

    return timeDifference === 0 ? left.key.localeCompare(right.key) : timeDifference;
  });
}

function getRemainingRetrySeconds(failure: AnonymousChatPendingMessageFailure) {
  const retryAvailableAt = Date.parse(failure.failedAt) + (failure.retryAfterSeconds ?? 0) * 1_000;

  return Math.max(0, Math.ceil((retryAvailableAt - Date.now()) / 1_000));
}

function DateDivider({ dateTime }: { dateTime: string }) {
  return (
    <div className="flex items-center gap-3 py-2" role="separator">
      <span aria-hidden="true" className="h-px flex-1 bg-border-strong" />
      <time dateTime={dateTime} className="shrink-0 text-caption text-muted">
        {formatChatDateDivider(dateTime)}
      </time>
      <span aria-hidden="true" className="h-px flex-1 bg-border-strong" />
    </div>
  );
}

function CounterpartMessage({
  counterpartName,
  message,
}: {
  counterpartName: string;
  message: ConfirmedDisplayMessage;
}) {
  return (
    <article
      aria-label={`${counterpartName}의 메시지`}
      data-counterpart-message-id={message.messageId}
      className="flex gap-2 pr-12"
    >
      {/* TODO: 상대 프로필 이미지 정책 확정 후 API 응답의 이미지 표시 */}
      <div aria-hidden="true" className="h-9 w-9 shrink-0 rounded-[35%] bg-disabled" />
      <div className="min-w-0">
        <p className="text-caption font-bold text-foreground">{counterpartName}</p>
        <p className="mt-1.5 rounded-[18px] rounded-tl-[4px] bg-surface px-4 py-2.5 text-body break-words whitespace-pre-wrap text-foreground">
          {message.content}
        </p>
        <time dateTime={message.sentAt} className="mt-1.5 block text-caption text-muted">
          {formatChatMessageTime(message.sentAt)}
        </time>
      </div>
    </article>
  );
}

function FailedMessageStatus({
  clientMessageId,
  failure,
  onRetryMessage,
}: {
  clientMessageId: string;
  failure: AnonymousChatPendingMessageFailure;
  onRetryMessage: (clientMessageId: string) => void;
}) {
  const [remainingRetrySeconds, setRemainingRetrySeconds] = useState(() =>
    getRemainingRetrySeconds(failure),
  );

  useEffect(() => {
    if (getRemainingRetrySeconds(failure) === 0) return;

    const timer = window.setInterval(() => {
      const remainingSeconds = getRemainingRetrySeconds(failure);

      setRemainingRetrySeconds(remainingSeconds);

      if (remainingSeconds === 0) {
        window.clearInterval(timer);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [failure]);

  return (
    <div className="mt-1 flex flex-col items-end gap-1">
      <p role="alert" className="text-caption text-danger">
        {failure.message}
      </p>
      {failure.canRetry && (
        <button
          type="button"
          disabled={remainingRetrySeconds > 0}
          className="rounded-sm border border-border-strong bg-surface px-3 py-1.5 text-caption text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onRetryMessage(clientMessageId)}
        >
          {remainingRetrySeconds > 0 ? `${remainingRetrySeconds}초 후 다시 보내기` : "다시 보내기"}
        </button>
      )}
    </div>
  );
}

function MyMessage({
  message,
  onRetryMessage,
}: {
  message: AnonymousChatDisplayMessage;
  onRetryMessage: (clientMessageId: string) => void;
}) {
  return (
    <article aria-label="내 메시지" className="flex flex-col items-end pl-12">
      <div className="flex items-end gap-1.5">
        {message.deliveryStatus === "SENT" && message.unreadCount > 0 && (
          <span
            className="text-caption text-muted"
            aria-label={`읽지 않은 사람 ${message.unreadCount}명`}
          >
            {message.unreadCount}
          </span>
        )}
        <p className="rounded-[18px] rounded-br-[4px] bg-primary px-4 py-2.5 text-body break-words whitespace-pre-wrap text-on-primary">
          {message.content}
        </p>
      </div>
      <time dateTime={message.sentAt} className="mt-1.5 text-caption text-muted">
        {formatChatMessageTime(message.sentAt)}
      </time>
      {message.deliveryStatus === "SENDING" && (
        <p role="status" className="mt-1 text-caption text-muted">
          전송 중
        </p>
      )}
      {message.deliveryStatus === "FAILED" && message.failure && (
        <FailedMessageStatus
          key={message.failure.failedAt}
          clientMessageId={message.clientMessageId}
          failure={message.failure}
          onRetryMessage={onRetryMessage}
        />
      )}
    </article>
  );
}

export default function AnonymousChatMessageList({
  counterpartName,
  messages,
  pendingMessages,
  hasNext,
  isLoadingPreviousMessages,
  previousMessagesError,
  onLoadPreviousMessages,
  onLastVisibleCounterpartMessageChange,
  onRetryMessage,
}: AnonymousChatMessageListProps) {
  const displayMessages = useMemo(
    () => createDisplayMessages(messages, pendingMessages),
    [messages, pendingMessages],
  );
  const listRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const previousScrollTopRef = useRef(0);
  const previousMessageCountRef = useRef(0);
  const isInitialScrollCompleteRef = useRef(false);

  const requestPreviousMessages = () => {
    const list = listRef.current;

    if (!list || !hasNext || isLoadingPreviousMessages) {
      return;
    }

    previousScrollHeightRef.current = list.scrollHeight;
    previousScrollTopRef.current = list.scrollTop;
    previousMessageCountRef.current = displayMessages.length;
    void onLoadPreviousMessages();
  };

  useLayoutEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    if (previousScrollHeightRef.current !== null) {
      list.scrollTop =
        list.scrollHeight - previousScrollHeightRef.current + previousScrollTopRef.current;
      previousScrollHeightRef.current = null;
      return;
    }

    list.scrollTop = list.scrollHeight;
    isInitialScrollCompleteRef.current = true;
  }, [displayMessages.length]);

  useEffect(() => {
    if (
      !isLoadingPreviousMessages &&
      previousScrollHeightRef.current !== null &&
      previousMessageCountRef.current === displayMessages.length
    ) {
      previousScrollHeightRef.current = null;
    }
  }, [isLoadingPreviousMessages, displayMessages.length]);

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    const visibleMessageIds = new Set<number>();
    const reportLastVisibleMessage = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      for (let index = displayMessages.length - 1; index >= 0; index -= 1) {
        const message = displayMessages[index];

        if (
          !message.isMine &&
          message.messageId !== null &&
          visibleMessageIds.has(message.messageId)
        ) {
          onLastVisibleCounterpartMessageChange(message.messageId);
          return;
        }
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = Number((entry.target as HTMLElement).dataset.counterpartMessageId);

          if (!Number.isSafeInteger(messageId)) {
            return;
          }

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            visibleMessageIds.add(messageId);
          } else {
            visibleMessageIds.delete(messageId);
          }
        });

        reportLastVisibleMessage();
      },
      {
        root: list,
        threshold: 0.5,
      },
    );

    list
      .querySelectorAll<HTMLElement>("[data-counterpart-message-id]")
      .forEach((messageElement) => observer.observe(messageElement));
    document.addEventListener("visibilitychange", reportLastVisibleMessage);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", reportLastVisibleMessage);
    };
  }, [displayMessages, onLastVisibleCounterpartMessageChange]);

  const handleScroll = () => {
    const list = listRef.current;

    if (
      !list ||
      !isInitialScrollCompleteRef.current ||
      list.scrollTop > LOAD_PREVIOUS_SCROLL_THRESHOLD_PX ||
      previousMessagesError
    ) {
      return;
    }

    requestPreviousMessages();
  };

  return (
    <div
      ref={listRef}
      role="log"
      aria-label={`${counterpartName}님과의 대화`}
      onScroll={handleScroll}
      className={`-mx-page min-h-0 flex-1 overflow-y-auto overscroll-contain px-page pt-1 pb-4 ${styles.chatList}`}
    >
      <div className="pb-2 text-center">
        {isLoadingPreviousMessages && (
          <p role="status" className="text-caption text-muted">
            이전 메시지를 불러오는 중이에요.
          </p>
        )}
        {previousMessagesError && (
          <div>
            <p role="alert" className="text-caption text-danger">
              {previousMessagesError.message}
            </p>
            {previousMessagesError.canRetry && (
              <button
                type="button"
                disabled={previousMessagesError.retryAfterSeconds > 0}
                className="mt-1 rounded-sm border border-border-strong bg-surface px-3 py-1.5 text-caption text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                onClick={requestPreviousMessages}
              >
                {previousMessagesError.retryAfterSeconds > 0
                  ? `${previousMessagesError.retryAfterSeconds}초 후 다시 시도`
                  : "다시 시도"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {displayMessages.map((message, index) => {
          const previousMessage = displayMessages[index - 1];
          const hasDateDivider =
            !previousMessage ||
            getChatMessageDateKey(message.sentAt) !== getChatMessageDateKey(previousMessage.sentAt);

          return (
            <Fragment key={message.key}>
              {hasDateDivider && <DateDivider dateTime={message.sentAt} />}
              {message.isMine ? (
                <MyMessage message={message} onRetryMessage={onRetryMessage} />
              ) : (
                <CounterpartMessage counterpartName={counterpartName} message={message} />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
