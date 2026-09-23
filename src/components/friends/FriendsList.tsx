// 친구 목록을 커서 기반 무한 스크롤로 표시하는 컴포넌트
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import EmptyFriends from "@/components/friends/EmptyFriends";
import FriendCard from "@/components/friends/FriendCard";
import { getFriends, type FriendListItem } from "@/lib/api/friends";

const PAGE_SIZE = 20;

type FriendsListProps = {
  onHasFriendsChange: (hasFriends: boolean) => void;
};

export default function FriendsList({ onHasFriendsChange }: FriendsListProps) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isKakaoFriendSynced, setIsKakaoFriendSynced] = useState<boolean | null>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const hasNextRef = useRef(true);
  const nextCursorRef = useRef<string | null>(null);

  const loadNextPage = useCallback(async () => {
    if (isLoadingRef.current || !hasNextRef.current) {
      return;
    }

    const isFirstPage = nextCursorRef.current === null;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const data = await getFriends({
        cursor: nextCursorRef.current ?? undefined,
        size: PAGE_SIZE,
      });

      if (!isMountedRef.current) {
        return;
      }

      if (isFirstPage) {
        onHasFriendsChange(data.items.length > 0);
        setIsKakaoFriendSynced(data.isKakaoFriendSynced);
      }

      setFriends((currentFriends) => [...currentFriends, ...data.items]);
      nextCursorRef.current = data.nextCursor;
      hasNextRef.current = data.hasNext && Boolean(data.nextCursor);
      setNextCursor(data.nextCursor);
      setHasNext(hasNextRef.current);
    } catch {
      if (isMountedRef.current) {
        router.replace("/error");
      }
    } finally {
      isLoadingRef.current = false;

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [onHasFriendsChange, router]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadNextPage();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNext) {
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
  }, [hasNext, loadNextPage, nextCursor]);

  if (!isLoading && friends.length === 0 && !hasNext) {
    return <EmptyFriends showKakaoConnectButton={isKakaoFriendSynced === false} />;
  }

  return (
    <ul
      aria-label="선물할 친구"
      aria-busy={isLoading}
      className="mt-12 flex list-none flex-col gap-5 p-0"
    >
      {friends.map((friend) => (
        <li key={friend.userId}>
          <FriendCard
            userId={friend.userId}
            name={friend.name}
            profileImageUrl={friend.profileImageUrl}
          />
        </li>
      ))}

      {hasNext && <li ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {isLoading && (
        <li role="status" className="py-4 text-center text-body-sm text-muted">
          친구 목록을 불러오는 중이에요.
        </li>
      )}
    </ul>
  );
}
