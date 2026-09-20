// 선택한 친구의 상세 정보를 표시하는 페이지

import Link from "next/link";

import { temporaryFriends } from "@/mocks/recommendationTargets";

type FriendDetailPageProps = {
  params: Promise<{ friendId: string }>;
};

export default async function FriendDetailPage({ params }: FriendDetailPageProps) {
  const { friendId } = await params;
  const friend =
    temporaryFriends[friendId as keyof typeof temporaryFriends] ?? temporaryFriends["1"];
  const birthdayDetail =
    friend.dDay === null ? friend.birthday : `${friend.birthday} · 생일 D-${friend.dDay}`;

  return (
    <main aria-label="친구 상세" className="page-content flex flex-1 flex-col bg-background">
      <section
        aria-labelledby="friend-name"
        className="flex flex-col items-center pt-12 text-center"
      >
        <div
          role="img"
          aria-label={`${friend.name} 프로필 이미지`}
          className="h-32 w-32 shrink-0 rounded-full bg-background-subtle"
        />
        <h1 id="friend-name" className="mt-4 text-heading-1 font-bold text-foreground">
          {friend.name}
        </h1>
        <p
          className={`mt-2 text-body font-semibold ${friend.dDay === null ? "text-muted" : "text-[#f05a28]"}`}
        >
          {birthdayDetail}
        </p>
        <div className="mt-6 w-full max-w-[360px]">
          <Link
            href={`/products?targetType=FRIEND&targetUserId=${friend.userId}`}
            className="flex h-12 w-full items-center justify-center rounded-[6px] bg-primary px-4 text-center text-[15px] leading-[26px] text-on-primary"
          >
            <span className="font-semibold">{friend.name}에게 선물하기</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
