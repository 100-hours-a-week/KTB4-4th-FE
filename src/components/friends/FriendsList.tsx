// 친구 목록을 커서 기반 무한 스크롤로 표시하는 컴포넌트
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import EmptyFriends from "@/components/friends/EmptyFriends";
import FriendCard from "@/components/friends/FriendCard";
import { ApiRequestError } from "@/lib/api/client";
import { getFriends, type FriendListItem, updateFriendFavorite } from "@/lib/api/friends";

const PAGE_SIZE = 20;

type FriendsListProps = {
  isFavorite: boolean;
  keyword: string;
  onHasFriendsChange: (hasFriends: boolean) => void;
  onKakaoFriendSyncedChange: (isKakaoFriendSynced: boolean) => void;
  onFriendCountsChange: (totalCount: number, favoriteTotalCount: number) => void;
  onFavoriteCountChange: (previousIsFavorite: boolean, nextIsFavorite: boolean) => void;
};

type FriendListRequestError = {
  message: string;
  retryAfterSeconds: number;
};

type FavoriteRequestError = FriendListRequestError & {
  userId: number;
};

export default function FriendsList({
  isFavorite,
  keyword,
  onHasFriendsChange,
  onKakaoFriendSyncedChange,
  onFriendCountsChange,
  onFavoriteCountChange,
}: FriendsListProps) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isKakaoFriendSynced, setIsKakaoFriendSynced] = useState<boolean | null>(null);
  const [requestError, setRequestError] = useState<FriendListRequestError | null>(null);
  const [pendingFavoriteUserIds, setPendingFavoriteUserIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [favoriteRequestError, setFavoriteRequestError] = useState<FavoriteRequestError | null>(
    null,
  );
  const sentinelRef = useRef<HTMLLIElement>(null);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const hasNextRef = useRef(true);
  const nextCursorRef = useRef<string | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const pendingFavoriteUserIdsRef = useRef(new Set<number>());

  const loadNextPage = useCallback(async () => {
    if (isLoadingRef.current || !hasNextRef.current) {
      return;
    }

    const isFirstPage = nextCursorRef.current === null;
    const requestController = new AbortController();

    requestControllerRef.current = requestController;
    isLoadingRef.current = true;
    setIsLoading(true);
    setRequestError(null);

    try {
      const data = await getFriends({
        cursor: nextCursorRef.current ?? undefined,
        size: PAGE_SIZE,
        favorite: isFavorite ? true : undefined,
        keyword: keyword || undefined,
        signal: requestController.signal,
      });

      if (!isMountedRef.current || requestControllerRef.current !== requestController) {
        return;
      }

      if (isFirstPage) {
        onHasFriendsChange(data.items.length > 0);
        setIsKakaoFriendSynced(data.isKakaoFriendSynced);
        onKakaoFriendSyncedChange(data.isKakaoFriendSynced);

        if (typeof data.totalCount === "number" && typeof data.favoriteTotalCount === "number") {
          onFriendCountsChange(data.totalCount, data.favoriteTotalCount);
        }
      }

      setFriends((currentFriends) =>
        isFirstPage ? data.items : [...currentFriends, ...data.items],
      );
      nextCursorRef.current = data.nextCursor;
      hasNextRef.current = data.hasNext && Boolean(data.nextCursor);
      setNextCursor(data.nextCursor);
      setHasNext(hasNextRef.current);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      if (error instanceof ApiRequestError && error.status === 429) {
        setRequestError({
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds ?? 0,
        });
        return;
      }

      router.replace("/error");
    } finally {
      if (requestControllerRef.current === requestController) {
        requestControllerRef.current = null;
        isLoadingRef.current = false;

        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
  }, [
    isFavorite,
    keyword,
    onFriendCountsChange,
    onHasFriendsChange,
    onKakaoFriendSyncedChange,
    router,
  ]);

  const handleToggleFavorite = useCallback(
    async (userId: number, currentIsFavorite: boolean) => {
      if (
        pendingFavoriteUserIdsRef.current.has(userId) ||
        (favoriteRequestError?.userId === userId && favoriteRequestError.retryAfterSeconds > 0)
      ) {
        return;
      }

      pendingFavoriteUserIdsRef.current.add(userId);
      setPendingFavoriteUserIds(new Set(pendingFavoriteUserIdsRef.current));
      setFavoriteRequestError(null);

      try {
        const updatedFavorite = await updateFriendFavorite(userId, !currentIsFavorite);

        if (!isMountedRef.current) {
          return;
        }

        setFriends((currentFriends) => {
          const updatedFriends = currentFriends.map((friend) =>
            friend.userId === updatedFavorite.userId
              ? { ...friend, isFavorite: updatedFavorite.isFavorite }
              : friend,
          );

          return isFavorite && !updatedFavorite.isFavorite
            ? updatedFriends.filter((friend) => friend.userId !== updatedFavorite.userId)
            : updatedFriends;
        });
        onFavoriteCountChange(currentIsFavorite, updatedFavorite.isFavorite);
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setFavoriteRequestError({
          userId,
          message:
            error instanceof ApiRequestError
              ? error.message
              : "즐겨찾기를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          retryAfterSeconds:
            error instanceof ApiRequestError && error.status === 429
              ? (error.retryAfterSeconds ?? 0)
              : 0,
        });
      } finally {
        pendingFavoriteUserIdsRef.current.delete(userId);

        if (isMountedRef.current) {
          setPendingFavoriteUserIds(new Set(pendingFavoriteUserIdsRef.current));
        }
      }
    },
    [favoriteRequestError, isFavorite, onFavoriteCountChange, router],
  );

  useEffect(() => {
    isMountedRef.current = true;
    void loadNextPage();

    return () => {
      isMountedRef.current = false;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      isLoadingRef.current = false;
    };
  }, [loadNextPage]);

  useEffect(() => {
    if (!requestError || requestError.retryAfterSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRequestError((currentError) => {
        if (!currentError || currentError.retryAfterSeconds <= 1) {
          window.clearInterval(timer);
          return currentError ? { ...currentError, retryAfterSeconds: 0 } : null;
        }

        return {
          ...currentError,
          retryAfterSeconds: currentError.retryAfterSeconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [requestError]);

  useEffect(() => {
    if (!favoriteRequestError || favoriteRequestError.retryAfterSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setFavoriteRequestError((currentError) => {
        if (!currentError || currentError.retryAfterSeconds <= 1) {
          window.clearInterval(timer);
          return currentError ? { ...currentError, retryAfterSeconds: 0 } : null;
        }

        return {
          ...currentError,
          retryAfterSeconds: currentError.retryAfterSeconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [favoriteRequestError]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNext || requestError) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, loadNextPage, nextCursor, requestError]);

  if (!isLoading && friends.length === 0 && !hasNext) {
    const emptyVariant = keyword ? "search" : isFavorite ? "favorites" : "friends";

    return (
      <EmptyFriends
        variant={emptyVariant}
        showKakaoConnectButton={emptyVariant === "friends" && isKakaoFriendSynced === false}
      />
    );
  }

  const visibleFriends = isFavorite ? friends.filter((friend) => friend.isFavorite) : friends;

  return (
    <ul
      aria-label={isFavorite ? "즐겨찾는 친구" : "전체 친구"}
      aria-busy={isLoading}
      className="mt-6 flex list-none flex-col gap-5 p-0"
    >
      {visibleFriends.map((friend) => {
        const friendFavoriteError =
          favoriteRequestError?.userId === friend.userId ? favoriteRequestError : null;

        return (
          <li key={friend.userId}>
            <FriendCard
              userId={friend.userId}
              name={friend.name}
              profileImageUrl={friend.profileImageUrl}
              birthDate={friend.birthDate}
              isFavorite={friend.isFavorite}
              isFavoritePending={pendingFavoriteUserIds.has(friend.userId)}
              isFavoriteDisabled={Boolean(
                friendFavoriteError && friendFavoriteError.retryAfterSeconds > 0,
              )}
              onToggleFavorite={() => void handleToggleFavorite(friend.userId, friend.isFavorite)}
            />
            {friendFavoriteError && (
              <p role="alert" className="mt-1 text-right text-caption text-danger">
                {friendFavoriteError.message}
                {friendFavoriteError.retryAfterSeconds > 0 &&
                  ` ${friendFavoriteError.retryAfterSeconds}초 후 다시 시도해 주세요.`}
              </p>
            )}
          </li>
        );
      })}

      {hasNext && !requestError && <li ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {isLoading && (
        <li role="status" className="py-4 text-center text-body-sm text-muted">
          친구 목록을 불러오는 중이에요.
        </li>
      )}

      {requestError && (
        <li className="py-4 text-center">
          <p role="alert" className="text-body-sm text-danger">
            {requestError.message}
          </p>
          <button
            type="button"
            disabled={requestError.retryAfterSeconds > 0}
            className="mt-2 rounded-sm border border-border-strong bg-surface px-4 py-2 text-body-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void loadNextPage()}
          >
            {requestError.retryAfterSeconds > 0
              ? `${requestError.retryAfterSeconds}초 후 다시 시도`
              : "다시 시도"}
          </button>
        </li>
      )}
    </ul>
  );
}
