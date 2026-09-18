// 선물할 친구 목록을 표시하는 페이지

import PageIntro from "@/components/common/PageIntro";
import EmptyFriends from "@/components/friends/EmptyFriends";
import FriendCard from "@/components/friends/FriendCard";

type Friend = {
  id: number;
  name: string;
  detail: string;
  highlightDetail: boolean;
};

// TODO: 친구 목록 API가 연결되면 실제 친구 데이터로 교체
const friends: Friend[] = [];

export default function FriendsPage() {
  const hasFriends = friends.length > 0;

  return (
    <main aria-label="친구" className="page-content flex flex-1 flex-col bg-background pt-4">
      <PageIntro
        title="누구에게 선물할까요?"
        description={
          hasFriends
            ? "친구의 취향이 반영된 선물을 추천해드려요."
            : "니쥬와 대화한 친구에게 바로 물어볼 수 있어요."
        }
      />
      {hasFriends ? (
        <ul aria-label="선물할 친구" className="mt-12 flex list-none flex-col gap-5 p-0">
          {friends.map((friend) => (
            <li key={friend.id}>
              <FriendCard
                name={friend.name}
                detail={friend.detail}
                highlightDetail={friend.highlightDetail}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyFriends />
      )}
    </main>
  );
}
