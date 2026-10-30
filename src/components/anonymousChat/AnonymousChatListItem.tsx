// 대화 상대·상품·마지막 메시지와 안 읽은 메시지 수를 표시하고, 스와이프로 나가기 버튼을 제공하는 대화 목록 행
"use client";

import Link from "next/link";

import AnonymousChatProfileImage from "@/components/anonymousChat/AnonymousChatProfileImage";
import useSwipeReveal from "@/hooks/useSwipeReveal";
import { getAnonymousChatRoomHref } from "@/lib/anonymousChatNavigation";
import type {
  AnonymousChatListItem as AnonymousChatListItemData,
  AnonymousChatType,
} from "@/lib/api/anonymousChats";
import { formatChatTime } from "@/lib/formatChatTime";

import type { MouseEvent } from "react";

type AnonymousChatListItemProps = {
  chat: AnonymousChatListItemData;
  type: AnonymousChatType;
  isLeaveRevealed: boolean;
  onRevealLeave: (roomId: number | null) => void;
  onLeave: (roomId: number) => void;
};

const LEAVE_ACTION_WIDTH = 72;
const MAX_UNREAD_COUNT_LABEL = 99;

export default function AnonymousChatListItem({
  chat,
  type,
  isLeaveRevealed,
  onRevealLeave,
  onLeave,
}: AnonymousChatListItemProps) {
  const {
    roomId,
    counterpartAlias,
    counterpartProfile,
    product,
    lastMessage,
    lastActiveAt,
    hasUnreadMessage,
    unreadMessageCount,
  } = chat;
  const displayAlias = counterpartAlias.trim();
  const unreadCountLabel =
    unreadMessageCount > MAX_UNREAD_COUNT_LABEL
      ? `${MAX_UNREAD_COUNT_LABEL}+`
      : String(unreadMessageCount);
  const instructionId = `chat-swipe-instruction-${roomId}`;
  const { translateX, isDragging, swipeHandlers, resetSwipe, consumeSwipeClick } = useSwipeReveal({
    actionWidth: LEAVE_ACTION_WIDTH,
    isRevealed: isLeaveRevealed,
    onRevealChange: (isRevealed) => onRevealLeave(isRevealed ? roomId : null),
  });

  // 스와이프 직후이거나 나가기 버튼이 열려 있으면 채팅방으로 이동하지 않고 버튼만 닫음
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (consumeSwipeClick()) {
      event.preventDefault();
      return;
    }

    if (isLeaveRevealed) {
      event.preventDefault();
      onRevealLeave(null);
    }
  };

  return (
    // 행 배경과 나가기 버튼이 화면 좌우 끝까지 닿도록 페이지 여백만큼 확장함
    <li className="relative -mx-page overflow-hidden">
      {/* 전역 button 스타일(글꼴 상속)의 영향을 받지 않도록 글자 모양은 안쪽 span에 적용함 */}
      <button
        type="button"
        aria-label={`${displayAlias} 대화방 나가기`}
        aria-hidden={!isLeaveRevealed}
        tabIndex={isLeaveRevealed ? 0 : -1}
        className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center border-0 bg-danger p-0"
        onClick={() => onLeave(roomId)}
      >
        <span className="text-body font-bold text-surface">나가기</span>
      </button>

      <Link
        href={getAnonymousChatRoomHref(roomId, type)}
        draggable={false}
        aria-describedby={instructionId}
        className={`relative flex touch-pan-y gap-3 bg-background px-page py-4 select-none hover:bg-background-subtle ${
          isDragging ? "" : "transition-[transform,background-color] duration-200 ease-standard"
        }`}
        style={{ transform: `translateX(${translateX}px)` }}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            onRevealLeave(roomId);
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            onRevealLeave(null);
          }
        }}
        {...swipeHandlers}
        onTouchCancel={resetSwipe}
      >
        <span id={instructionId} className="sr-only">
          눌러서 대화방 열기, 왼쪽으로 밀거나 왼쪽 방향키를 눌러 나가기 버튼 표시
        </span>

        <AnonymousChatProfileImage
          profile={counterpartProfile}
          alt={`${displayAlias} 프로필 이미지`}
          size={48}
          className="h-12 w-12"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] leading-6 font-bold text-foreground">{displayAlias}</p>
          <p className="mt-0.5 truncate text-body-sm text-foreground-secondary">{product.name}</p>
          {/* 긴 메시지는 두 줄까지만 표시하고 말줄임 처리함 */}
          {lastMessage && (
            <p className="mt-1 line-clamp-2 break-words text-body text-foreground">
              {lastMessage.content}
            </p>
          )}
        </div>

        {/* 전송 시각 아래에 안 읽은 메시지 수를 오른쪽 정렬로 표시함 */}
        <div className="flex shrink-0 flex-col items-end gap-3 pt-1.5">
          <time dateTime={lastActiveAt} className="text-caption text-muted">
            {formatChatTime(lastActiveAt)}
          </time>
          {hasUnreadMessage && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-birthday px-2 text-body-sm font-bold text-surface">
              <span className="sr-only">안 읽은 메시지 </span>
              {unreadCountLabel}
              <span className="sr-only">개</span>
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
