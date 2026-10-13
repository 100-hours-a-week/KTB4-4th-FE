// 로그인 확인 직후 알림 SSE 연결을 열고 알림 목록과 읽지 않은 개수를 공유하는 Context
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ApiRequestError } from "@/lib/api/client";
import { checkLoginValidity } from "@/lib/api/loginValidity";
import { getNotifications } from "@/lib/api/notifications";
import {
  closeNotificationStream,
  openNotificationStream,
  updateNotificationServerTime,
} from "@/lib/api/notificationStream";
import { parseServerDateTime } from "@/lib/parseServerDateTime";
import type {
  NotificationCreatedEvent,
  NotificationItem,
  NotificationListPage,
} from "@/types/notification";

const RECOVERY_PAGE_SIZE = 50;

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  hasNext: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  loadMoreNotifications: () => Promise<void>;
  deleteNotification: (notificationId: number) => void;
  markAllNotificationsAsRead: () => void;
  closeStream: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function sortByCreatedAtDesc(items: NotificationItem[]) {
  return [...items].sort(
    (a, b) => parseServerDateTime(b.createdAt) - parseServerDateTime(a.createdAt),
  );
}

// 웹 푸시·재연결 복구로 같은 알림이 중복될 수 있어 notificationId 기준으로 병합함
function mergeNotifications(currentItems: NotificationItem[], incomingItems: NotificationItem[]) {
  const currentIds = new Set(currentItems.map((item) => item.notificationId));
  const newItems = incomingItems.filter((item) => !currentIds.has(item.notificationId));

  if (newItems.length === 0) return currentItems;

  return sortByCreatedAtDesc([...currentItems, ...newItems]);
}

function toNotificationItem({ unreadCount: _unreadCount, ...event }: NotificationCreatedEvent) {
  return { ...event, readAt: null } satisfies NotificationItem;
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : "알림을 불러오지 못했습니다.";
}

function getRetryDelayMs(error: unknown) {
  if (error instanceof ApiRequestError && error.status === 429) {
    return (error.retryAfterSeconds ?? 0) * 1000;
  }

  return null;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const retryAvailableAtRef = useRef(0);
  const retryTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const isMountedRef = useRef(false);

  const handleListError = useCallback((error: unknown, retry?: () => void) => {
    if (!isMountedRef.current) return;

    setErrorMessage(getErrorMessage(error));

    const retryDelayMs = getRetryDelayMs(error);

    if (retryDelayMs === null) return;

    retryAvailableAtRef.current = Date.now() + retryDelayMs;

    if (!retry) return;

    const timer = setTimeout(() => {
      retryTimersRef.current.delete(timer);
      retry();
    }, retryDelayMs);

    retryTimersRef.current.add(timer);
  }, []);

  // 429 응답이면 retryAfterSeconds 이후 같은 요청을 다시 실행함
  const runListRequest = useCallback(
    (
      request: () => Promise<NotificationListPage>,
      onSuccess: (page: NotificationListPage) => void,
    ) => {
      const run = async () => {
        try {
          const page = await request();

          if (!isMountedRef.current) return;

          updateNotificationServerTime(page.serverTime);
          onSuccess(page);
          setErrorMessage(null);
        } catch (error) {
          handleListError(error, () => void run());
        }
      };

      return run();
    },
    [handleListError],
  );

  const loadInitialNotifications = useCallback(
    () =>
      runListRequest(
        () => getNotifications(),
        (page) => {
          setNotifications((currentItems) => mergeNotifications(currentItems, page.items));
          setUnreadCount(page.unreadCount);
          setNextCursor(page.nextCursor);
          setHasNext(page.hasNext);
        },
      ),
    [runListRequest],
  );

  // 재연결 시 직전 기준 시각 이후 생성된 알림을 조회해 목록 상단에 병합함
  const recoverMissedNotifications = useCallback(
    (since: string) =>
      runListRequest(
        () => getNotifications({ since, size: RECOVERY_PAGE_SIZE }),
        (page) => {
          setNotifications((currentItems) => mergeNotifications(currentItems, page.items));
          setUnreadCount(page.unreadCount);
        },
      ),
    [runListRequest],
  );

  const loadMoreNotifications = useCallback(async () => {
    if (!hasNext || !nextCursor || isLoadingMore) return;
    if (Date.now() < retryAvailableAtRef.current) return;

    setIsLoadingMore(true);

    try {
      const page = await getNotifications({ cursor: nextCursor });

      if (!isMountedRef.current) return;

      setNotifications((currentItems) => mergeNotifications(currentItems, page.items));
      setUnreadCount(page.unreadCount);
      setNextCursor(page.nextCursor);
      setHasNext(page.hasNext);
      setErrorMessage(null);
    } catch (error) {
      handleListError(error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [hasNext, nextCursor, isLoadingMore, handleListError]);

  // TODO: 알림 삭제 API 연동
  const deleteNotification = useCallback(
    (notificationId: number) => {
      const target = notifications.find((item) => item.notificationId === notificationId);

      if (target?.readAt === null) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setNotifications((currentItems) =>
        currentItems.filter((item) => item.notificationId !== notificationId),
      );
    },
    [notifications],
  );

  // TODO: 알림 모두 읽음 API 연동
  const markAllNotificationsAsRead = useCallback(() => {
    const readAt = new Date().toISOString();

    setNotifications((currentItems) =>
      currentItems.map((item) => (item.readAt === null ? { ...item, readAt } : item)),
    );
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    const retryTimers = retryTimersRef.current;

    isMountedRef.current = true;

    checkLoginValidity()
      .then(() => {
        if (!isMountedRef.current) return;

        openNotificationStream({
          onConnected: (_event, previousServerTime) => {
            if (previousServerTime) {
              void recoverMissedNotifications(previousServerTime);
            }
          },
          onNotification: (event) => {
            setNotifications((currentItems) =>
              mergeNotifications(currentItems, [toNotificationItem(event)]),
            );
            setUnreadCount(event.unreadCount);
          },
        });

        void loadInitialNotifications();
      })
      .catch(() => {
        // 로그인 확인 실패 시 각 페이지의 인증 처리에 맡기고 연결을 열지 않음
      });

    // 페이지 이동 중에도 연결을 유지해야 하므로 언마운트 시 연결은 닫지 않음
    return () => {
      isMountedRef.current = false;
      retryTimers.forEach((timer) => clearTimeout(timer));
      retryTimers.clear();
    };
  }, [loadInitialNotifications, recoverMissedNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      hasNext,
      isLoadingMore,
      errorMessage,
      loadMoreNotifications,
      deleteNotification,
      markAllNotificationsAsRead,
      closeStream: closeNotificationStream,
    }),
    [
      notifications,
      unreadCount,
      hasNext,
      isLoadingMore,
      errorMessage,
      loadMoreNotifications,
      deleteNotification,
      markAllNotificationsAsRead,
    ],
  );

  return <NotificationContext value={value}>{children}</NotificationContext>;
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotificationContext는 NotificationProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
