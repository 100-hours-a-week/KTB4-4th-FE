// 누르면 알림을 확인하고, 스와이프로 삭제 동작을 제공하는 개별 알림 항목
"use client";

import { useRef, useState } from "react";

import type { PointerEvent as ReactPointerEvent } from "react";

const DELETE_ACTION_WIDTH = 72;
const SWIPE_THRESHOLD = DELETE_ACTION_WIDTH / 2;
// 이 거리 이상 움직였으면 스와이프로 보고 누르기로 처리하지 않음
const TAP_MOVE_TOLERANCE = 5;

type NotificationItemProps = {
  id: number;
  title: string;
  description: string;
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
  description,
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
          <p className="m-0 text-body-lg font-bold text-foreground">{title}</p>
          <p className="mt-3 mb-0 text-body-sm text-muted">{description}</p>
          <time className="mt-0.5 block text-right text-body-sm text-muted">{createdAt}</time>
        </div>
      </div>
    </li>
  );
}
