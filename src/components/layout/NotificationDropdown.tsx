// 헤더의 알림 버튼과 알림 목록 드롭다운
"use client";

import { useEffect, useId, useRef, useState } from "react";

import { useNotificationContext } from "@/contexts/NotificationContext";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

import NotificationItem from "./NotificationItem";

export default function NotificationDropdown() {
  const {
    notifications,
    hasUnread,
    hasNext,
    isListLoaded,
    isInitialLoading,
    isLoadingMore,
    errorMessage,
    loadNotificationsIfNeeded,
    loadMoreNotifications,
    deleteNotification: deleteNotificationItem,
    markAllNotificationsAsRead: markAllNotificationItemsAsRead,
  } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [revealedNotificationId, setRevealedNotificationId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const dropdownId = useId();
  const headingId = useId();
  // 첫 조회 결과를 받기 전에는 빈 목록 문구 대신 로딩 문구를 보여줌
  const isWaitingInitialList = isInitialLoading || (!isListLoaded && !errorMessage);

  const deleteNotification = (notificationId: number) => {
    deleteNotificationItem(notificationId);
    setRevealedNotificationId(null);
  };

  const markAllNotificationsAsRead = () => {
    markAllNotificationItemsAsRead();
    setRevealedNotificationId(null);
  };

  // 드롭다운을 처음 열 때 알림 목록 첫 페이지를 조회함
  useEffect(() => {
    if (isOpen) {
      void loadNotificationsIfNeeded();
    }
  }, [isOpen, loadNotificationsIfNeeded]);

  // 목록 끝에 닿으면 다음 커서의 알림을 이어서 조회함
  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!isOpen || !sentinel || !hasNext) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadMoreNotifications();
        }
      },
      { root: listRef.current, rootMargin: "100px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, hasNext, loadMoreNotifications, notifications.length]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setRevealedNotificationId(null);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setRevealedNotificationId(null);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="absolute left-page flex items-center">
      <button
        type="button"
        aria-label={isOpen ? "알림 닫기" : "알림 열기"}
        aria-controls={dropdownId}
        aria-expanded={isOpen}
        className="touch-target relative flex items-center justify-start border-0 bg-transparent p-0 text-foreground"
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
      >
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18M3.262 15.326A1 1 0 0 0 4 17H20A1 1 0 0 0 20.738 15.326C19.411 13.956 18 12.499 18 8A6 6 0 0 0 6 8C6 12.499 4.589 13.956 3.262 15.326Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {hasUnread && (
          <span
            aria-hidden="true"
            className="absolute top-2.5 left-[22px] size-1.5 rounded-full bg-danger"
          />
        )}
      </button>

      {isOpen && (
        <section
          id={dropdownId}
          aria-labelledby={headingId}
          className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-[calc(100vw-2rem)] max-w-[calc(var(--app-max-width)-2rem)] overflow-hidden rounded-md border border-border-strong bg-surface shadow-lg"
        >
          <h2 id={headingId} className="m-0 px-5 py-4 text-heading-3 font-bold">
            알림
          </h2>

          {notifications.length > 0 ? (
            <>
              <ul
                ref={listRef}
                className={`m-0 list-none border-t border-border p-0 ${notifications.length >= 4 ? "max-h-72 overflow-y-auto overscroll-contain" : ""}`}
              >
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.notificationId}
                    id={notification.notificationId}
                    title={notification.title}
                    description={notification.body}
                    createdAt={formatRelativeTime(notification.createdAt)}
                    isUnread={notification.readAt === null}
                    isDeleteRevealed={revealedNotificationId === notification.notificationId}
                    onDelete={deleteNotification}
                    onRevealDelete={setRevealedNotificationId}
                  />
                ))}
                {hasNext && <li ref={sentinelRef} aria-hidden="true" className="h-px" />}
              </ul>
              {(isLoadingMore || errorMessage) && (
                <p
                  role={errorMessage ? "alert" : "status"}
                  className="m-0 border-t border-border px-5 py-2 text-center text-body-sm text-muted"
                >
                  {isLoadingMore ? "알림을 불러오는 중입니다." : errorMessage}
                </p>
              )}
              <div className="flex justify-end border-t border-border px-3 py-1">
                <button
                  type="button"
                  disabled={!hasUnread}
                  className="group touch-target flex items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed"
                  onClick={markAllNotificationsAsRead}
                >
                  <span className="rounded-sm bg-background-subtle px-2.5 py-1 text-body-sm font-bold text-foreground-secondary group-disabled:text-muted">
                    모두 읽음
                  </span>
                </button>
              </div>
            </>
          ) : (
            <p
              role={isWaitingInitialList ? "status" : undefined}
              className="m-0 border-t border-border px-5 py-8 text-center text-body text-muted"
            >
              {isWaitingInitialList
                ? "알림을 불러오는 중입니다."
                : (errorMessage ?? "새로운 알림이 없습니다.")}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
