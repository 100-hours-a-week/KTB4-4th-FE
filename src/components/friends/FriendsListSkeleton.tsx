// 친구 목록 첫 페이지를 받기 전 카드 자리를 채우는 스켈레톤 목록

import FriendCardSkeleton from "@/components/friends/FriendCardSkeleton";

const SKELETON_COUNT = 6;

export default function FriendsListSkeleton() {
  return (
    <ul aria-busy="true" className="mt-3.5 flex list-none flex-col p-0">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index}>
          <FriendCardSkeleton />
        </li>
      ))}
      <li role="status" className="sr-only">
        친구 목록을 불러오는 중이에요.
      </li>
    </ul>
  );
}
