// 채팅방 메시지를 날짜 구분선·연결 안내 문구와 함께 표시하고 새 메시지에 맞춰 스크롤하는 목록
"use client";

import { Fragment, useEffect, useRef } from "react";

import type { AnonymousChatMessage } from "@/lib/api/anonymousChatRoom";
import {
  formatChatDateDivider,
  formatChatMessageTime,
  getChatMessageDateKey,
} from "@/lib/formatChatMessageTime";

import styles from "./AnonymousChatList.module.css";

type AnonymousChatMessageListProps = {
  counterpartName: string;
  connectedAt: string;
  messages: AnonymousChatMessage[];
};

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
      <p className="rounded-[18px] rounded-br-[4px] bg-primary px-4 py-2.5 text-body break-words whitespace-pre-wrap text-on-primary">
        {message.content}
      </p>
      <time dateTime={message.sentAt} className="mt-1.5 text-caption text-muted">
        {formatChatMessageTime(message.sentAt)}
      </time>
    </article>
  );
}

export default function AnonymousChatMessageList({
  counterpartName,
  connectedAt,
  messages,
}: AnonymousChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      ref={listRef}
      role="log"
      aria-label={`${counterpartName}님과의 대화`}
      className={`-mx-page min-h-0 flex-1 overflow-y-auto overscroll-contain px-page pt-1 pb-4 ${styles.chatList}`}
    >
      <DateDivider dateTime={connectedAt} />
      <p className="mt-1 flex justify-center">
        <span className="rounded-full border border-border-strong px-3 py-1 text-caption text-muted">
          {counterpartName}님과 대화가 연결됐어요
        </span>
      </p>

      <div className="mt-6 flex flex-col gap-5">
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1];
          const previousDateKey = getChatMessageDateKey(previousMessage?.sentAt ?? connectedAt);
          const hasDateDivider = getChatMessageDateKey(message.sentAt) !== previousDateKey;

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
