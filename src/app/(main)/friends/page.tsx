// 선물할 친구 목록을 표시하는 페이지
"use client";

import { useCallback, useEffect, useState } from "react";

import PageIntro from "@/components/common/PageIntro";
import SegmentedTabs, { type SegmentedTabItem } from "@/components/common/SegmentedTabs";
import FriendSearchField from "@/components/friends/FriendSearchField";
import FriendsList from "@/components/friends/FriendsList";
import KakaoFriendConnectButton from "@/components/friends/KakaoFriendConnectButton";

type FriendsTab = "all" | "favorite";

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

export default function FriendsPage() {
  const [selectedTab, setSelectedTab] = useState<FriendsTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [hasFriends, setHasFriends] = useState<boolean | null>(null);
  const [isKakaoFriendSynced, setIsKakaoFriendSynced] = useState<boolean | null>(null);
  const [friendCounts, setFriendCounts] = useState<FriendCounts | null>(null);
  const pageCopy = FRIENDS_PAGE_COPY[selectedTab];
  const friendsTabs = createFriendsTabs(friendCounts);

  const handleFriendCountsChange = useCallback((totalCount: number, favoriteTotalCount: number) => {
    setFriendCounts({ total: totalCount, favorite: favoriteTotalCount });
  }, []);

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
    <main aria-label="친구" className="page-content flex flex-1 flex-col bg-background">
      <PageIntro
        title={pageCopy.title}
        description={hasFriends === false ? pageCopy.emptyDescription : pageCopy.description}
      />
      {/* 응답 전이나 미동기화 상태에도 버튼 높이만큼 자리를 유지해 레이아웃 이동 방지 */}
      <div className="mt-2 flex h-touch justify-end px-1">
        {isKakaoFriendSynced === true && <KakaoFriendConnectButton variant="sync" />}
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
      <FriendsList
        key={`${selectedTab}:${searchKeyword}`}
        isFavorite={selectedTab === "favorite"}
        keyword={searchKeyword}
        onHasFriendsChange={setHasFriends}
        onKakaoFriendSyncedChange={setIsKakaoFriendSynced}
        onFriendCountsChange={handleFriendCountsChange}
      />
    </main>
  );
}
