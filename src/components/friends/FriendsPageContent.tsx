// 친구 목록 페이지의 탭·검색·목록 상태를 관리하는 클라이언트 화면
"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import PageIntro from "@/components/common/PageIntro";
import SegmentedTabs, { type SegmentedTabItem } from "@/components/common/SegmentedTabs";
import FriendSearchField from "@/components/friends/FriendSearchField";
import FriendsList from "@/components/friends/FriendsList";
import FriendsListSkeleton from "@/components/friends/FriendsListSkeleton";
import KakaoFriendConnectButton from "@/components/friends/KakaoFriendConnectButton";
import UpcomingBirthdaySection from "@/components/friends/UpcomingBirthdaySection";
import { ApiRequestError } from "@/lib/api/client";
import {
  getUpcomingFriendEvents,
  type FriendsPage,
  type UpcomingFriendEvent,
} from "@/lib/api/friends";

type FriendsTab = "all" | "favorite";

type FriendsPageContentProps = {
  initialFriendsPromise: Promise<FriendsPage | null>;
};

// 서버에서 미리 조회한 첫 페이지와 같은 조건(전체 탭, 검색어 없음)의 목록 키
const INITIAL_LIST_KEY = "all:";

type FriendCounts = {
  total: number;
  favorite: number;
};

type UpcomingEventsError = {
  message: string;
  retryAfterSeconds: number;
};

// 응답 전에도 세 자리 숫자 너비를 확보해 친구 수 표시 시 탭 라벨 이동 방지
const FRIEND_COUNT_CLASS_NAME = "min-w-[3ch] text-left tabular-nums";

function createFriendsTabs(counts: FriendCounts | null): readonly SegmentedTabItem<FriendsTab>[] {
  return [
    {
      value: "all",
      label: (
        <span className="inline-flex items-center gap-1">
          전체 친구 <span className={FRIEND_COUNT_CLASS_NAME}>{counts?.total}</span>
        </span>
      ),
    },
    {
      value: "favorite",
      label: (
        <span className="inline-flex items-center gap-1">
          즐겨찾는 친구 <span className={FRIEND_COUNT_CLASS_NAME}>{counts?.favorite}</span>
        </span>
      ),
    },
  ];
}

const FRIENDS_PAGE_COPY: Record<
  FriendsTab,
  { title: string; description: string; emptyDescription: string }
> = {
  all: {
    title: "누구에게 선물할까요?",
    description: "친구의 취향이 반영된 선물을 추천해드려요.",
    emptyDescription: "니쥬와 대화한 친구에게 바로 물어볼 수 있어요.",
  },
  favorite: {
    title: "즐겨찾는 친구예요!",
    description: "자주 찾는 친구의 취향을 알아보아요.",
    emptyDescription: "친구를 즐겨찾기에 추가하면 여기에서 빠르게 찾을 수 있어요.",
  },
};

export default function FriendsPageContent({ initialFriendsPromise }: FriendsPageContentProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<FriendsTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [hasFriends, setHasFriends] = useState<boolean | null>(null);
  const [isKakaoFriendSynced, setIsKakaoFriendSynced] = useState<boolean | null>(null);
  const [friendCounts, setFriendCounts] = useState<FriendCounts | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingFriendEvent[]>([]);
  const [upcomingEventsError, setUpcomingEventsError] = useState<UpcomingEventsError | null>(null);
  const [upcomingEventsRequestId, setUpcomingEventsRequestId] = useState(0);
  const [hasLeftInitialList, setHasLeftInitialList] = useState(false);
  const listKey = `${selectedTab}:${searchKeyword}`;

  // 탭이나 검색어를 한 번이라도 바꾸면 이후에는 서버 첫 페이지를 다시 쓰지 않고 새로 조회
  if (!hasLeftInitialList && listKey !== INITIAL_LIST_KEY) {
    setHasLeftInitialList(true);
  }

  const pageCopy = FRIENDS_PAGE_COPY[selectedTab];
  const friendsTabs = createFriendsTabs(friendCounts);
  // 빈 목록에 카카오 친구 연동 버튼이 표시되는 경우에만 상단 동기화 버튼 숨김
  const isKakaoConnectButtonVisible =
    isKakaoFriendSynced === false &&
    hasFriends === false &&
    selectedTab === "all" &&
    !searchKeyword;

  const handleFriendCountsChange = useCallback((totalCount: number, favoriteTotalCount: number) => {
    setFriendCounts({ total: totalCount, favorite: favoriteTotalCount });
  }, []);

  const handleFavoriteCountChange = useCallback(
    (previousIsFavorite: boolean, nextIsFavorite: boolean) => {
      if (previousIsFavorite === nextIsFavorite) {
        return;
      }

      setFriendCounts((currentCounts) =>
        currentCounts
          ? {
              ...currentCounts,
              favorite: Math.max(0, currentCounts.favorite + (nextIsFavorite ? 1 : -1)),
            }
          : currentCounts,
      );
    },
    [],
  );

  useEffect(() => {
    const requestController = new AbortController();

    const loadUpcomingEvents = async () => {
      setUpcomingEventsError(null);

      try {
        const events = await getUpcomingFriendEvents(requestController.signal);

        setUpcomingEvents(events);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setUpcomingEventsError({
          message:
            error instanceof ApiRequestError
              ? error.message
              : "다가오는 친구 이벤트를 불러오지 못했습니다.",
          retryAfterSeconds:
            error instanceof ApiRequestError && error.status === 429
              ? (error.retryAfterSeconds ?? 0)
              : 0,
        });
      }
    };

    void loadUpcomingEvents();

    return () => requestController.abort();
  }, [router, upcomingEventsRequestId]);

  useEffect(() => {
    if (!upcomingEventsError || upcomingEventsError.retryAfterSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setUpcomingEventsError((currentError) => {
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
  }, [upcomingEventsError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (hasFriends === null) {
      return;
    }

    const currentUrl = new URL(window.location.href);

    if (currentUrl.searchParams.get("kakaoFriendSync") !== "success") {
      return;
    }

    currentUrl.searchParams.delete("kakaoFriendSync");
    window.history.replaceState(
      window.history.state,
      "",
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
    );
  }, [hasFriends]);

  return (
    // 목록 끝이 하단 내비게이션의 돌출된 AI 버튼에 가려지지 않도록 하단 여백 확보
    <main
      aria-label="친구"
      className="page-content flex flex-1 flex-col bg-background pb-[calc(var(--spacing-bottom-nav-overlap)+var(--spacing-page))]"
    >
      <PageIntro
        title={pageCopy.title}
        description={hasFriends === false ? pageCopy.emptyDescription : pageCopy.description}
      />
      {/* 동기화 버튼을 숨길 때도 버튼 높이만큼 자리를 유지해 레이아웃 이동 방지 */}
      <div className="mt-2 flex h-touch justify-end px-1">
        {!isKakaoConnectButtonVisible && <KakaoFriendConnectButton variant="sync" />}
      </div>
      <UpcomingBirthdaySection events={upcomingEvents} />
      {upcomingEventsError && (
        <div className="mt-3 text-center">
          <p role="alert" className="text-body-sm text-danger">
            {upcomingEventsError.message}
          </p>
          <button
            type="button"
            disabled={upcomingEventsError.retryAfterSeconds > 0}
            className="mt-2 rounded-sm border border-border-strong bg-surface px-4 py-2 text-body-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setUpcomingEventsRequestId((requestId) => requestId + 1)}
          >
            {upcomingEventsError.retryAfterSeconds > 0
              ? `${upcomingEventsError.retryAfterSeconds}초 후 다시 시도`
              : "다시 시도"}
          </button>
        </div>
      )}
      <SegmentedTabs
        items={friendsTabs}
        value={selectedTab}
        onChange={setSelectedTab}
        ariaLabel="친구 목록 유형"
        className="mt-4"
      />
      <div className="mt-5">
        <FriendSearchField
          isFavorite={selectedTab === "favorite"}
          value={searchInput}
          onChange={setSearchInput}
          onSearch={() => setSearchKeyword(searchInput.trim())}
        />
      </div>
      <Suspense fallback={<FriendsListSkeleton />}>
        <FriendsList
          key={listKey}
          isFavorite={selectedTab === "favorite"}
          keyword={searchKeyword}
          initialPagePromise={hasLeftInitialList ? undefined : initialFriendsPromise}
          onHasFriendsChange={setHasFriends}
          onKakaoFriendSyncedChange={setIsKakaoFriendSynced}
          onFriendCountsChange={handleFriendCountsChange}
          onFavoriteCountChange={handleFavoriteCountChange}
        />
      </Suspense>
    </main>
  );
}
