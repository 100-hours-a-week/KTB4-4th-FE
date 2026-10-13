// 친구가 없을 때 안내 아이콘과 문구를 표시하는 컴포넌트

import KakaoFriendConnectButton from "@/components/friends/KakaoFriendConnectButton";

type EmptyFriendsVariant = "friends" | "favorites" | "search";

type EmptyFriendsProps = {
  variant: EmptyFriendsVariant;
  showKakaoConnectButton: boolean;
};

const EMPTY_CONTENT: Record<EmptyFriendsVariant, { title: string; description: string }> = {
  friends: {
    title: "선물을 추천받을 친구가 아직 없어요.",
    description: "카카오톡 친구가 니쥬를 시작하면 이곳에 표시돼요.",
  },
  favorites: {
    title: "즐겨찾는 친구가 아직 없어요.",
    description: "친구를 즐겨찾기에 추가하면 여기에서 빠르게 찾을 수 있어요.",
  },
  search: {
    title: "검색 결과가 없어요.",
    description: "다른 검색어로 다시 찾아보세요.",
  },
};

export default function EmptyFriends({ variant, showKakaoConnectButton }: EmptyFriendsProps) {
  const content = EMPTY_CONTENT[variant];

  return (
    <section className="mt-[clamp(120px,20vh,190px)] flex flex-col items-center text-center">
      <svg
        aria-hidden="true"
        className="h-24 w-24 text-[#a3a3a3]"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="48" cy="48" r="48" className="fill-background-subtle" />
        <circle cx="48" cy="38" r="14" stroke="currentColor" strokeWidth="2" />
        <path
          d="M25 76c2-15 10-23 23-23s21 8 23 23"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="m70 29 7 7m0-7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="mt-4 text-body-lg font-bold text-foreground">{content.title}</p>
      <p className="mt-1 text-body-sm text-muted">{content.description}</p>
      {showKakaoConnectButton && (
        <div className="mt-5 w-full max-w-[332px]">
          <KakaoFriendConnectButton />
        </div>
      )}
    </section>
  );
}
