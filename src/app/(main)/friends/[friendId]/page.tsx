// 선택한 친구의 상세 정보를 표시하는 페이지

import ActionButton from "@/components/common/ActionButton";

type FriendDetailPageProps = {
  params: Promise<{ friendId: string }>;
};

// TODO: 친구 프로필 이미지, 이름, 생일 날짜와 D-day API 연동
const temporaryFriends = {
  "1": { name: "토쿠노 유우시", birthday: "4월 05일", dDay: 7 },
  "2": { name: "츠키시마 케이", birthday: "생일 정보 없음", dDay: null },
} as const;

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
          <ActionButton>
            <span className="font-semibold">{friend.name}에게 선물하기</span>
          </ActionButton>
        </div>
      </section>
    </main>
  );
}
