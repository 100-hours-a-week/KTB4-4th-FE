// 선물할 친구 목록을 표시하는 페이지
"use client";

import { useEffect, useState } from "react";

import PageIntro from "@/components/common/PageIntro";
import FriendsList from "@/components/friends/FriendsList";
import KakaoFriendConnectButton from "@/components/friends/KakaoFriendConnectButton";

export default function FriendsPage() {
  const [hasFriends, setHasFriends] = useState<boolean | null>(null);
  const [isKakaoFriendSynced, setIsKakaoFriendSynced] = useState<boolean | null>(null);

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
        title="누구에게 선물할까요?"
        description={
          hasFriends === null
            ? ""
            : hasFriends
              ? "친구의 취향이 반영된 선물을 추천해드려요."
              : "니쥬와 대화한 친구에게 바로 물어볼 수 있어요."
        }
      />
      {isKakaoFriendSynced === true && (
        <div className="mt-2 flex justify-end px-1">
          <KakaoFriendConnectButton variant="sync" />
        </div>
      )}
      <FriendsList
        onHasFriendsChange={setHasFriends}
        onKakaoFriendSyncedChange={setIsKakaoFriendSynced}
      />
    </main>
  );
}
