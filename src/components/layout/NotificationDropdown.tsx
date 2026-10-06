// 헤더의 알림 버튼과 알림 목록 드롭다운
"use client";

import { useEffect, useId, useRef, useState } from "react";

import NotificationItem from "./NotificationItem";

type Notification = {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  isUnread: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "민준 님이 친구로 추가했어요.",
    description: "친구의 취향을 확인해 보세요.",
    createdAt: "방금 전",
    isUnread: false,
  },
  {
    id: 2,
    title: "수연 님의 생일이 8일 남았어요.",
    description: "지금 선물을 준비하면 여유 있게 도착해요.",
    createdAt: "어제",
    isUnread: true,
  },
  {
    id: 3,
    title: "수연 님의 생일이 8일 남았어요.",
    description: "지금 선물을 준비하면 여유 있게 도착해요.",
    createdAt: "어제",
    isUnread: false,
  },
  {
    id: 4,
    title: "수연 님의 생일이 8일 남았어요.",
    description: "지금 선물을 준비하면 여유 있게 도착해요.",
    createdAt: "어제",
    isUnread: true,
  },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([...initialNotifications]);
  const [revealedNotificationId, setRevealedNotificationId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownId = useId();
  const headingId = useId();
  const hasUnreadNotification = notifications.some((notification) => notification.isUnread);

  const deleteNotification = (notificationId: number) => {
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId),
    );
    setRevealedNotificationId(null);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, isUnread: false })),
    );
    setRevealedNotificationId(null);
  };

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
    <div ref={containerRef} className="absolute right-page flex items-center">
      <button
        type="button"
        aria-label={isOpen ? "알림 닫기" : "알림 열기"}
        aria-controls={dropdownId}
        aria-expanded={isOpen}
        className="touch-target relative flex items-center justify-center border-0 bg-transparent p-0 text-foreground"
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
      >
        <span aria-hidden="true" className="material-symbols-rounded text-[24px] leading-none">
          notifications
        </span>
        {hasUnreadNotification && (
          <span
            aria-hidden="true"
            className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-danger"
          />
        )}
      </button>

      {isOpen && (
        <section
          id={dropdownId}
          aria-labelledby={headingId}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-[calc(100vw-2rem)] max-w-[calc(var(--app-max-width)-2rem)] overflow-hidden rounded-md border border-border-strong bg-surface shadow-lg"
        >
          <h2 id={headingId} className="m-0 px-5 py-4 text-heading-3 font-bold">
            알림
          </h2>

          {notifications.length > 0 ? (
            <>
              <ul
                className={`m-0 list-none border-t border-border p-0 ${notifications.length >= 4 ? "max-h-72 overflow-y-auto overscroll-contain" : ""}`}
              >
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    {...notification}
                    isDeleteRevealed={revealedNotificationId === notification.id}
                    onDelete={deleteNotification}
                    onRevealDelete={setRevealedNotificationId}
                  />
                ))}
              </ul>
              <div className="flex justify-end border-t border-border px-3 py-1">
                <button
                  type="button"
                  disabled={!hasUnreadNotification}
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
            <p className="m-0 border-t border-border px-5 py-8 text-center text-body text-muted">
              새로운 알림이 없습니다.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
