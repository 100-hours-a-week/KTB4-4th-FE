// 누르면 알림을 확인하고, 스와이프로 삭제 동작을 제공하는 개별 알림 항목
"use client";

import { useRef, useState } from "react";

import type { NotificationThumbnail, NotificationTitleParts } from "@/lib/notificationDisplay";

import type { PointerEvent as ReactPointerEvent } from "react";

const DELETE_ACTION_WIDTH = 72;
const SWIPE_THRESHOLD = DELETE_ACTION_WIDTH / 2;
// 이 거리 이상 움직였으면 스와이프로 보고 누르기로 처리하지 않음
const TAP_MOVE_TOLERANCE = 5;

type NotificationItemProps = {
  id: number;
  title: string;
  // 상품명처럼 제목 일부를 강조할 때만 전달하며, 없으면 title을 그대로 보여줌
  titleParts?: NotificationTitleParts | null;
  description: string;
  // 구매 여부 알림처럼 상품 미리보기가 있는 알림에만 전달함
  thumbnail?: NotificationThumbnail | null;
  createdAt: string;
  isUnread: boolean;
  isDeleteRevealed: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onRevealDelete: (id: number | null) => void;
};

export default function NotificationItem({
  id,
  title,
  titleParts,
  description,
  thumbnail,
  createdAt,
  isUnread,
  isDeleteRevealed,
  onSelect,
  onDelete,
  onRevealDelete,
}: NotificationItemProps) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const currentOffsetRef = useRef(0);
  const hasMovedRef = useRef(false);
  const instructionId = `notification-swipe-instruction-${id}`;
  const restingOffset = isDeleteRevealed ? -DELETE_ACTION_WIDTH : 0;
  const translateX = dragOffset ?? restingOffset;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerStartXRef.current = event.clientX;
    currentOffsetRef.current = restingOffset;
    hasMovedRef.current = false;
    setDragOffset(restingOffset);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStartXRef.current === null) return;

    const distance = event.clientX - pointerStartXRef.current;

    if (Math.abs(distance) >= TAP_MOVE_TOLERANCE) {
      hasMovedRef.current = true;
    }

    const nextOffset = Math.max(-DELETE_ACTION_WIDTH, Math.min(0, restingOffset + distance));

    currentOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const handlePointerEnd = () => {
    if (pointerStartXRef.current === null) return;

    onRevealDelete(currentOffsetRef.current <= -SWIPE_THRESHOLD ? id : null);
    pointerStartXRef.current = null;
    setDragOffset(null);
  };

  const handlePointerCancel = () => {
    pointerStartXRef.current = null;
    setDragOffset(null);
  };

  // 삭제 버튼이 열려 있으면 알림을 열지 않고 삭제 버튼만 닫음
  const selectNotification = () => {
    if (isDeleteRevealed) {
      onRevealDelete(null);
      return;
    }

    onSelect(id);
  };

  const handleClick = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    selectNotification();
  };

  return (
    <li className="relative overflow-hidden border-b border-border last:border-b-0">
      <button
        type="button"
        aria-label={`${title} 알림 삭제`}
        aria-hidden={!isDeleteRevealed}
        tabIndex={isDeleteRevealed ? 0 : -1}
        className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center border-0 bg-danger p-0 text-body font-bold text-surface"
        onClick={() => onDelete(id)}
      >
        삭제
      </button>

      <div
        role="button"
        tabIndex={0}
        aria-describedby={instructionId}
        className={`relative cursor-pointer touch-pan-y select-none px-5 py-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-info ${isUnread ? "bg-warning-subtle" : "bg-surface"} ${dragOffset === null ? "transition-transform duration-200 ease-standard" : ""}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectNotification();
          }

          if (event.key === "ArrowLeft") {
            event.preventDefault();
            onRevealDelete(id);
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            onRevealDelete(null);
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
      >
        <span id={instructionId} className="sr-only">
          눌러서 알림 확인, 왼쪽으로 밀거나 왼쪽 방향키를 눌러 삭제 버튼 표시
        </span>
        <div>
          {titleParts ? (
            // 상품명이 길어도 뒤 문구가 잘리지 않도록 둘째 줄에서 상품명만 말줄임 처리함
            <p className="m-0 text-body-lg font-bold text-foreground">
              <span className="block">{titleParts.before}</span>
              <span className="flex min-w-0">
                <span className="min-w-0 truncate text-info">{titleParts.highlight}</span>
                <span className="shrink-0">{titleParts.after}</span>
              </span>
            </p>
          ) : (
            <p className="m-0 line-clamp-2 text-body-lg font-bold text-foreground">{title}</p>
          )}
          <p className="mt-3 mb-0 text-body-sm text-muted">{description}</p>
          {thumbnail && (
            <div
              role="img"
              aria-label={`${thumbnail.productName} 상품 이미지`}
              className="mt-2 size-12 rounded-sm bg-disabled bg-cover bg-center bg-no-repeat"
              style={
                thumbnail.imageUrl
                  ? { backgroundImage: `url(${JSON.stringify(thumbnail.imageUrl)})` }
                  : undefined
              }
            />
          )}
          <time className="mt-0.5 block text-right text-body-sm text-muted">{createdAt}</time>
        </div>
      </div>
    </li>
  );
}
