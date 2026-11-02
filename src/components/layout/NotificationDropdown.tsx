// 헤더의 알림 버튼과 알림 목록 드롭다운
"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import PurchaseCheckModal from "@/components/products/PurchaseCheckModal";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { ApiRequestError } from "@/lib/api/client";
import { getPurchaseCheck, type PurchaseCheck } from "@/lib/api/purchaseChecks";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { getNotificationDisplay } from "@/lib/notificationDisplay";
import { getNotificationTargetPath, getPurchaseCheckTargetId } from "@/lib/notificationTarget";
import type { NotificationCategoryFilter } from "@/types/notification";

import NotificationItem from "./NotificationItem";

const NOTIFICATION_CATEGORY_TABS = [
  { label: "전체", value: "ALL" },
  { label: "이벤트", value: "EVENT" },
  { label: "콕", value: "POKE" },
  { label: "구매여부", value: "PURCHASE_STATUS" },
  { label: "채팅", value: "CHAT" },
  { label: "친구가입", value: "FRIEND_JOINED" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: NotificationCategoryFilter;
}>;

export default function NotificationDropdown() {
  const {
    notifications,
    hasUnread,
    hasNext,
    isListLoaded,
    isInitialLoading,
    isLoadingMore,
    isMarkingAllAsRead,
    errorMessage,
    loadNotificationsIfNeeded,
    loadMoreNotifications,
    readNotification,
    deleteNotification: deleteNotificationItem,
    markAllNotificationsAsRead: markAllNotificationItemsAsRead,
  } = useNotificationContext();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategoryFilter>("ALL");
  const [revealedNotificationId, setRevealedNotificationId] = useState<number | null>(null);
  const [purchaseCheck, setPurchaseCheck] = useState<PurchaseCheck | null>(null);
  const [isLoadingPurchaseCheck, setIsLoadingPurchaseCheck] = useState(false);
  const [purchaseCheckErrorMessage, setPurchaseCheckErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const dropdownId = useId();
  const headingId = useId();
  // 첫 조회 결과를 받기 전에는 빈 목록 문구 대신 로딩 문구를 보여줌
  const isWaitingInitialList = isInitialLoading || (!isListLoaded && !errorMessage);
  // TODO: 카테고리별 알림 목록 API 연동 후 selectedCategory를 조회 조건으로 전달하고 클라이언트 필터링 제거
  const filteredNotifications =
    selectedCategory === "ALL"
      ? notifications
      : notifications.filter((notification) => notification.category === selectedCategory);

  const deleteNotification = (notificationId: number) => {
    void deleteNotificationItem(notificationId);
    setRevealedNotificationId(null);
  };

  // 구매 확인 정보를 먼저 조회하고, 성공했을 때만 드롭다운을 닫고 모달을 염
  const openPurchaseCheck = async (purchaseCheckId: number) => {
    if (isLoadingPurchaseCheck) return;

    setIsLoadingPurchaseCheck(true);
    setPurchaseCheckErrorMessage(null);

    try {
      const nextPurchaseCheck = await getPurchaseCheck(purchaseCheckId);

      setIsOpen(false);
      setRevealedNotificationId(null);
      setPurchaseCheck(nextPurchaseCheck);
    } catch (error) {
      // 404 등 조회에 실패하면 모달을 띄우지 않고 드롭다운에 메시지만 표시함
      setPurchaseCheckErrorMessage(
        error instanceof ApiRequestError ? error.message : "구매 확인 정보를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingPurchaseCheck(false);
    }
  };

  // 읽지 않은 알림이면 읽음 처리하고, 이동할 화면이나 열 모달이 있으면 드롭다운을 닫고 이동함
  const selectNotification = (notificationId: number) => {
    const notification = notifications.find((item) => item.notificationId === notificationId);

    if (!notification) return;

    void readNotification(notificationId);

    const purchaseCheckId = getPurchaseCheckTargetId(notification);

    if (purchaseCheckId !== null) {
      void openPurchaseCheck(purchaseCheckId);
      return;
    }

    const targetPath = getNotificationTargetPath(notification);

    if (!targetPath) return;

    setIsOpen(false);
    setRevealedNotificationId(null);
    router.push(targetPath);
  };

  const markAllNotificationsAsRead = () => {
    void markAllNotificationItemsAsRead();
    setRevealedNotificationId(null);
  };

  const handleCategoryKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const currentIndex = NOTIFICATION_CATEGORY_TABS.findIndex(
      (tab) => tab.value === selectedCategory,
    );
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % NOTIFICATION_CATEGORY_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + NOTIFICATION_CATEGORY_TABS.length) % NOTIFICATION_CATEGORY_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = NOTIFICATION_CATEGORY_TABS.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    setSelectedCategory(NOTIFICATION_CATEGORY_TABS[nextIndex].value);

    const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs[nextIndex]?.focus();
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
        setPurchaseCheckErrorMessage(null);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setRevealedNotificationId(null);
        setPurchaseCheckErrorMessage(null);
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
        onClick={() => {
          setIsOpen((currentIsOpen) => !currentIsOpen);
          setPurchaseCheckErrorMessage(null);
        }}
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

          <div
            role="tablist"
            aria-label="알림 카테고리"
            onKeyDown={handleCategoryKeyDown}
            className="flex items-center justify-between px-5 pb-3 whitespace-nowrap"
          >
            {NOTIFICATION_CATEGORY_TABS.map((tab) => {
              const isSelected = selectedCategory === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  className={`relative shrink-0 cursor-pointer border-0 bg-transparent p-0 text-body transition-colors ${
                    isSelected ? "text-foreground" : "text-muted"
                  }`}
                  onClick={() => setSelectedCategory(tab.value)}
                >
                  <span className="font-bold">{tab.label}</span>
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 bottom-1 left-0 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {filteredNotifications.length > 0 ? (
            <>
              <ul
                ref={listRef}
                className={`m-0 list-none border-t border-border p-0 ${filteredNotifications.length >= 4 ? "max-h-72 overflow-y-auto overscroll-contain" : ""}`}
              >
                {filteredNotifications.map((notification) => {
                  const { title, titleParts, titleLead, description, thumbnail } =
                    getNotificationDisplay(notification);

                  return (
                    <NotificationItem
                      key={notification.notificationId}
                      id={notification.notificationId}
                      title={title}
                      titleParts={titleParts}
                      titleLead={titleLead}
                      description={description}
                      thumbnail={thumbnail}
                      createdAt={formatRelativeTime(notification.createdAt)}
                      isUnread={notification.readAt === null}
                      isDeleteRevealed={revealedNotificationId === notification.notificationId}
                      onSelect={selectNotification}
                      onDelete={deleteNotification}
                      onRevealDelete={setRevealedNotificationId}
                    />
                  );
                })}
                {hasNext && <li ref={sentinelRef} aria-hidden="true" className="h-px" />}
              </ul>
              {(isLoadingPurchaseCheck || purchaseCheckErrorMessage) && (
                <p
                  role={purchaseCheckErrorMessage ? "alert" : "status"}
                  className="m-0 border-t border-border px-5 py-2 text-center text-body-sm text-muted"
                >
                  {isLoadingPurchaseCheck
                    ? "구매 확인 정보를 불러오는 중입니다."
                    : purchaseCheckErrorMessage}
                </p>
              )}
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
                  disabled={!hasUnread || isMarkingAllAsRead}
                  aria-busy={isMarkingAllAsRead}
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

      {purchaseCheck && (
        <PurchaseCheckModal
          open
          purchaseCheck={purchaseCheck}
          onClose={() => setPurchaseCheck(null)}
        />
      )}
    </div>
  );
}
