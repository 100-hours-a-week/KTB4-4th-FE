// 채팅방 메시지를 날짜 구분선과 함께 표시하고 커서 조회 전후의 스크롤 위치를 관리하는 목록
"use client";

import { Fragment, useEffect, useLayoutEffect, useRef } from "react";

import type { AnonymousChatMessage } from "@/lib/api/anonymousChatRoom";
import {
  formatChatDateDivider,
  formatChatMessageTime,
  getChatMessageDateKey,
} from "@/lib/formatChatMessageTime";

import styles from "./AnonymousChatList.module.css";

type AnonymousChatMessageListProps = {
  counterpartName: string;
  messages: AnonymousChatMessage[];
  hasNext: boolean;
  isLoadingPreviousMessages: boolean;
  previousMessagesError: {
    message: string;
    retryAfterSeconds: number;
    canRetry: boolean;
  } | null;
  onLoadPreviousMessages: () => Promise<void>;
};

const LOAD_PREVIOUS_SCROLL_THRESHOLD_PX = 80;

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
  message: AnonymousChatMessage;
}) {
  return (
    <article aria-label={`${counterpartName}의 메시지`} className="flex gap-2 pr-12">
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

function MyMessage({ message }: { message: AnonymousChatMessage }) {
  return (
    <article aria-label="내 메시지" className="flex flex-col items-end pl-12">
      <div className="flex items-end gap-1.5">
        {message.unreadCount > 0 && (
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
    </article>
  );
}

export default function AnonymousChatMessageList({
  counterpartName,
  messages,
  hasNext,
  isLoadingPreviousMessages,
  previousMessagesError,
  onLoadPreviousMessages,
}: AnonymousChatMessageListProps) {
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
    previousMessageCountRef.current = messages.length;
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
  }, [messages.length]);

  useEffect(() => {
    if (
      !isLoadingPreviousMessages &&
      previousScrollHeightRef.current !== null &&
      previousMessageCountRef.current === messages.length
    ) {
      previousScrollHeightRef.current = null;
    }
  }, [isLoadingPreviousMessages, messages.length]);

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
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1];
          const hasDateDivider =
            !previousMessage ||
            getChatMessageDateKey(message.sentAt) !== getChatMessageDateKey(previousMessage.sentAt);

          return (
            <Fragment key={message.messageId}>
              {hasDateDivider && <DateDivider dateTime={message.sentAt} />}
              {message.isMine ? (
                <MyMessage message={message} />
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
