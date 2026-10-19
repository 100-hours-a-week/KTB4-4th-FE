// 친구 목록 페이지의 탭·검색·목록 상태를 관리하는 클라이언트 화면
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import PageIntro from "@/components/common/PageIntro";
import SegmentedTabs, { type SegmentedTabItem } from "@/components/common/SegmentedTabs";
import FriendSearchField from "@/components/friends/FriendSearchField";
import FriendsList from "@/components/friends/FriendsList";
import FriendsListSkeleton from "@/components/friends/FriendsListSkeleton";
import KakaoFriendConnectButton from "@/components/friends/KakaoFriendConnectButton";
import type { FriendsPage } from "@/lib/api/friends";

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
  const [selectedTab, setSelectedTab] = useState<FriendsTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [hasFriends, setHasFriends] = useState<boolean | null>(null);
  const [isKakaoFriendSynced, setIsKakaoFriendSynced] = useState<boolean | null>(null);
  const [friendCounts, setFriendCounts] = useState<FriendCounts | null>(null);
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
