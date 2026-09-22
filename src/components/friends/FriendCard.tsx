// 친구의 이름과 기념일 정보를 표시하는 목록 카드

import Link from "next/link";

type FriendCardProps = {
  friendId: number;
  name: string;
  detail: string;
  highlightDetail?: boolean;
};

export default function FriendCard({
  friendId,
  name,
  detail,
  highlightDetail = false,
}: FriendCardProps) {
  return (
    <Link
      href={`/friends/${friendId}`}
      aria-label={`${name} 상세 보기`}
      className="flex min-h-12 items-center gap-3 bg-surface"
    >
      <div
        aria-hidden="true"
        className="h-12 w-12 shrink-0 overflow-hidden rounded-[35%] bg-background-subtle"
      />
      <div className="min-w-0">
        <p className="text-[18px] leading-6 font-medium text-foreground">{name}</p>
        <p className={`mt-0.5 text-body-sm ${highlightDetail ? "text-[#f05a28]" : "text-muted"}`}>
          {detail}
        </p>
      </div>
    </Link>
  );
}
