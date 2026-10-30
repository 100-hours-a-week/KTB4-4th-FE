// 누르면 알림을 확인하고, 스와이프로 삭제 동작을 제공하는 개별 알림 항목
"use client";

import useSwipeReveal from "@/hooks/useSwipeReveal";
import type {
  NotificationThumbnail,
  NotificationTitleLead,
  NotificationTitleParts,
} from "@/lib/notificationDisplay";

const DELETE_ACTION_WIDTH = 72;

function NotificationThumbnailImage({
  thumbnail,
  className,
}: {
  thumbnail: NotificationThumbnail;
  className: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${thumbnail.productName} 상품 이미지`}
      className={`size-12 rounded-sm bg-disabled bg-cover bg-center bg-no-repeat ${className}`}
      style={
        thumbnail.imageUrl
          ? { backgroundImage: `url(${JSON.stringify(thumbnail.imageUrl)})` }
          : undefined
      }
    />
  );
}

type NotificationItemProps = {
  id: number;
  title: string;
  // 상품명처럼 제목 일부를 강조할 때만 전달하며, 없으면 title을 그대로 보여줌
  titleParts?: NotificationTitleParts | null;
  // 익명대화방 알림처럼 첫 줄에 강조 문구(상품명), 둘째 줄에 나머지 문구를 표시할 때 전달함
  titleLead?: NotificationTitleLead | null;
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
  titleLead,
  description,
  thumbnail,
  createdAt,
  isUnread,
  isDeleteRevealed,
  onSelect,
  onDelete,
  onRevealDelete,
}: NotificationItemProps) {
  const instructionId = `notification-swipe-instruction-${id}`;
  const { translateX, isDragging, swipeHandlers, resetSwipe, consumeSwipeClick } = useSwipeReveal({
    actionWidth: DELETE_ACTION_WIDTH,
    isRevealed: isDeleteRevealed,
    onRevealChange: (isRevealed) => onRevealDelete(isRevealed ? id : null),
  });

  // 삭제 버튼이 열려 있으면 알림을 열지 않고 삭제 버튼만 닫음
  const selectNotification = () => {
    if (isDeleteRevealed) {
      onRevealDelete(null);
      return;
    }

    onSelect(id);
  };

  const handleClick = () => {
    if (consumeSwipeClick()) return;

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
        className={`relative cursor-pointer touch-pan-y select-none px-5 py-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-info ${isUnread ? "bg-warning-subtle" : "bg-surface"} ${isDragging ? "" : "transition-transform duration-200 ease-standard"}`}
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
        {...swipeHandlers}
        onTouchCancel={resetSwipe}
      >
        <span id={instructionId} className="sr-only">
          눌러서 알림 확인, 왼쪽으로 밀거나 왼쪽 방향키를 눌러 삭제 버튼 표시
        </span>
        <div>
          {titleLead ? (
            // 썸네일 오른쪽에 첫 줄은 강조 문구(상품명)만 말줄임 처리하고, 뒤 문구는 둘째 줄에 표시하며
            // 본문은 썸네일과 제목 아래에 표시함
            <>
              <div className="flex min-w-0 items-center gap-3">
                {thumbnail && (
                  <NotificationThumbnailImage thumbnail={thumbnail} className="shrink-0" />
                )}
                <p className="m-0 min-w-0 text-body font-bold text-foreground">
                  <span className="block truncate text-info">{titleLead.highlight}</span>
                  <span className="block">{titleLead.rest}</span>
                </p>
              </div>
              <p className="mt-3 mb-0 text-body-sm text-muted">{description}</p>
            </>
          ) : (
            <>
              {titleParts ? (
                // 상품명이 길어도 뒤 문구가 잘리지 않도록 둘째 줄에서 상품명만 말줄임 처리함
                <p className="m-0 text-body font-bold text-foreground">
                  <span className="block">{titleParts.before}</span>
                  <span className="flex min-w-0">
                    <span className="min-w-0 truncate text-info">{titleParts.highlight}</span>
                    <span className="shrink-0">{titleParts.after}</span>
                  </span>
                </p>
              ) : (
                <p className="m-0 line-clamp-2 text-body-lg font-bold text-foreground">{title}</p>
              )}
              {/* 상품 미리보기가 있는 카드는 제목과 본문을 붙이고 썸네일과의 간격을 넓힘 */}
              <p className={`${thumbnail ? "mt-1" : "mt-3"} mb-0 text-body-sm text-muted`}>
                {description}
              </p>
              {thumbnail && <NotificationThumbnailImage thumbnail={thumbnail} className="mt-3" />}
            </>
          )}
          <time className="mt-0.5 block text-right text-body-sm text-muted">{createdAt}</time>
        </div>
      </div>
    </li>
  );
}
