// 로그인 확인 직후 알림 SSE 연결을 열고 알림 목록과 미읽음 알림 상태를 공유하는 Context
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
import { getNotifications, getNotificationSummary } from "@/lib/api/notifications";
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
  hasUnread: boolean;
  unreadCount: number;
  hasNext: boolean;
  isListLoaded: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  loadNotificationsIfNeeded: () => Promise<void>;
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
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isListLoaded, setIsListLoaded] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const retryAvailableAtRef = useRef(0);
  const retryTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const isMountedRef = useRef(false);
  const summaryRequestRef = useRef<Promise<void> | null>(null);
  const isListLoadedRef = useRef(false);
  const initialListRequestRef = useRef<Promise<void> | null>(null);

  const applyUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
    setHasUnread(count > 0);
  }, []);

  const scheduleRetry = useCallback((retryDelayMs: number, retry: () => void) => {
    const timer = setTimeout(() => {
      retryTimersRef.current.delete(timer);
      retry();
    }, retryDelayMs);

    retryTimersRef.current.add(timer);
  }, []);

  const handleListError = useCallback(
    (error: unknown, retry?: () => void) => {
      if (!isMountedRef.current) return;

      setErrorMessage(getErrorMessage(error));

      const retryDelayMs = getRetryDelayMs(error);

      if (retryDelayMs === null) return;

      retryAvailableAtRef.current = Date.now() + retryDelayMs;

      if (retry) {
        scheduleRetry(retryDelayMs, retry);
      }
    },
    [scheduleRetry],
  );

  // 상단 알림 아이콘의 표시점 노출 여부를 조회하며, 이미 진행 중인 요청이 있으면 재사용함
  // 실패 시 기존 표시 상태를 유지하고, 429 응답이면 retryAfterSeconds 이후 다시 조회함
  const refreshNotificationSummary = useCallback(() => {
    const run = async () => {
      try {
        const summary = await getNotificationSummary();

        if (!isMountedRef.current) return;

        setHasUnread(summary.hasUnread);
        setUnreadCount(summary.unreadCount);
      } catch (error) {
        if (!isMountedRef.current) return;

        const retryDelayMs = getRetryDelayMs(error);

        if (retryDelayMs !== null) {
          scheduleRetry(retryDelayMs, () => void run());
        }
      }
    };

    if (!summaryRequestRef.current) {
      summaryRequestRef.current = run().finally(() => {
        summaryRequestRef.current = null;
      });
    }

    return summaryRequestRef.current;
  }, [scheduleRetry]);

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
          applyUnreadCount(page.unreadCount);
          setNextCursor(page.nextCursor);
          setHasNext(page.hasNext);
          isListLoadedRef.current = true;
          setIsListLoaded(true);
        },
      ),
    [runListRequest, applyUnreadCount],
  );

  // 알림 드롭다운을 처음 열 때만 첫 페이지를 조회하고, 조회 중이거나 이미 불러왔으면 생략함
  const loadNotificationsIfNeeded = useCallback(() => {
    if (isListLoadedRef.current) return Promise.resolve();

    if (!initialListRequestRef.current) {
      setIsInitialLoading(true);
      initialListRequestRef.current = loadInitialNotifications().finally(() => {
        initialListRequestRef.current = null;

        if (isMountedRef.current) {
          setIsInitialLoading(false);
        }
      });
    }

    return initialListRequestRef.current;
  }, [loadInitialNotifications]);

  // 재연결 시 직전 기준 시각 이후 생성된 알림을 조회해 목록 상단에 병합함
  const recoverMissedNotifications = useCallback(
    (since: string) =>
      runListRequest(
        () => getNotifications({ since, size: RECOVERY_PAGE_SIZE }),
        (page) => {
          setNotifications((currentItems) => mergeNotifications(currentItems, page.items));
          applyUnreadCount(page.unreadCount);
        },
      ),
    [runListRequest, applyUnreadCount],
  );

  const loadMoreNotifications = useCallback(async () => {
    if (!hasNext || !nextCursor || isLoadingMore) return;
    if (Date.now() < retryAvailableAtRef.current) return;

    setIsLoadingMore(true);

    try {
      const page = await getNotifications({ cursor: nextCursor });

      if (!isMountedRef.current) return;

      setNotifications((currentItems) => mergeNotifications(currentItems, page.items));
      applyUnreadCount(page.unreadCount);
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
  }, [hasNext, nextCursor, isLoadingMore, handleListError, applyUnreadCount]);

  // TODO: 알림 삭제 API 연동
  const deleteNotification = useCallback(
    (notificationId: number) => {
      const target = notifications.find((item) => item.notificationId === notificationId);

      if (target?.readAt === null) {
        applyUnreadCount(Math.max(0, unreadCount - 1));
      }

      setNotifications((currentItems) =>
        currentItems.filter((item) => item.notificationId !== notificationId),
      );
    },
    [notifications, unreadCount, applyUnreadCount],
  );

  // TODO: 알림 모두 읽음 API 연동
  const markAllNotificationsAsRead = useCallback(() => {
    const readAt = new Date().toISOString();

    setNotifications((currentItems) =>
      currentItems.map((item) => (item.readAt === null ? { ...item, readAt } : item)),
    );
    applyUnreadCount(0);
  }, [applyUnreadCount]);

  useEffect(() => {
    const retryTimers = retryTimersRef.current;

    isMountedRef.current = true;

    checkLoginValidity()
      .then(() => {
        if (!isMountedRef.current) return;

        void refreshNotificationSummary();

        openNotificationStream({
          onConnected: (_event, previousServerTime) => {
            // 연결·재연결 직후 끊긴 동안 바뀌었을 수 있는 표시점 상태를 다시 조회함
            void refreshNotificationSummary();

            // 목록을 아직 불러오지 않았다면 드롭다운을 열 때 최신 목록을 받으므로 복구 조회를 생략함
            if (previousServerTime && isListLoadedRef.current) {
              void recoverMissedNotifications(previousServerTime);
            }
          },
          onNotification: (event) => {
            if (isListLoadedRef.current) {
              setNotifications((currentItems) =>
                mergeNotifications(currentItems, [toNotificationItem(event)]),
              );
            }

            applyUnreadCount(event.unreadCount);
          },
        });
      })
      .catch(() => {
        // 로그인 확인 실패 시 각 페이지의 인증 처리에 맡기고 연결을 열지 않음
      });

    // (main) 내부 화면 전환 중에는 레이아웃이 유지되어 연결도 유지되고,
    // (main) 영역을 벗어나 Provider가 언마운트될 때만 연결을 닫음
    return () => {
      isMountedRef.current = false;
      retryTimers.forEach((timer) => clearTimeout(timer));
      retryTimers.clear();
      closeNotificationStream();
    };
  }, [recoverMissedNotifications, refreshNotificationSummary, applyUnreadCount]);

  const value = useMemo(
    () => ({
      notifications,
      hasUnread,
      unreadCount,
      hasNext,
      isListLoaded,
      isInitialLoading,
      isLoadingMore,
      errorMessage,
      loadNotificationsIfNeeded,
      loadMoreNotifications,
      deleteNotification,
      markAllNotificationsAsRead,
      closeStream: closeNotificationStream,
    }),
    [
      notifications,
      hasUnread,
      unreadCount,
      hasNext,
      isListLoaded,
      isInitialLoading,
      isLoadingMore,
      errorMessage,
      loadNotificationsIfNeeded,
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
