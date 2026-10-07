// 선물할 친구 목록을 표시하는 페이지
"use client";

import { useEffect, useState } from "react";

import PageIntro from "@/components/common/PageIntro";
import SegmentedTabs, { type SegmentedTabItem } from "@/components/common/SegmentedTabs";
import FriendSearchField from "@/components/friends/FriendSearchField";
import FriendsList from "@/components/friends/FriendsList";
import KakaoFriendConnectButton from "@/components/friends/KakaoFriendConnectButton";

type FriendsTab = "all" | "favorite";

// TODO: 친구 수 조회 API 연동 후 응답 값으로 교체
const FRIEND_COUNTS: Record<FriendsTab, number> = {
  all: 1,
  favorite: 0,
};

const FRIENDS_TABS: readonly SegmentedTabItem<FriendsTab>[] = [
  {
    value: "all",
    label: (
      <span className="inline-flex items-center gap-1">
        전체 친구 <span>{FRIEND_COUNTS.all}</span>
      </span>
    ),
  },
  {
    value: "favorite",
    label: (
      <span className="inline-flex items-center gap-1">
        즐겨찾는 친구 <span>{FRIEND_COUNTS.favorite}</span>
      </span>
    ),
  },
];

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
  const [hasFriends, setHasFriends] = useState<boolean | null>(null);
  const [isKakaoFriendSynced, setIsKakaoFriendSynced] = useState<boolean | null>(null);
  const pageCopy = FRIENDS_PAGE_COPY[selectedTab];

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
        description={
          hasFriends === null ? "" : hasFriends ? pageCopy.description : pageCopy.emptyDescription
        }
      />
      {isKakaoFriendSynced === true && (
        <div className="mt-2 flex justify-end px-1">
          <KakaoFriendConnectButton variant="sync" />
        </div>
      )}
      <SegmentedTabs
        items={FRIENDS_TABS}
        value={selectedTab}
        onChange={setSelectedTab}
        ariaLabel="친구 목록 유형"
        className={isKakaoFriendSynced === true ? "mt-4" : "mt-8"}
      />
      <div className="mt-5">
        <FriendSearchField isFavorite={selectedTab === "favorite"} />
      </div>
      <FriendsList
        isFavorite={selectedTab === "favorite"}
        onHasFriendsChange={setHasFriends}
        onKakaoFriendSyncedChange={setIsKakaoFriendSynced}
      />
    </main>
  );
}
