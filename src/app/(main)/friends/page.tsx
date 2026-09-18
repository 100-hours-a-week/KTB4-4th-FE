// 선물할 친구 목록을 표시하는 페이지

import PageIntro from "@/components/common/PageIntro";
import FriendCard from "@/components/friends/FriendCard";

const friends = [
  { id: 1, name: "토쿠노 유우시", detail: "4월 05일 • 생일 🎂", highlightDetail: true },
  { id: 2, name: "츠키시마 케이", detail: "생일 정보 없음", highlightDetail: false },
];

export default function FriendsPage() {
  return (
    <main aria-label="친구" className="page-content flex flex-1 flex-col bg-background pt-4">
      <PageIntro
        title="누구에게 선물할까요?"
        description="친구의 취향이 반영된 선물을 추천해드려요."
      />
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
    </main>
  );
}
