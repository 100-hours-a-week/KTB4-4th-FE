// 친구의 이름과 상세 페이지 이동 링크를 표시하는 목록 카드

import Image from "next/image";
import Link from "next/link";

type FriendCardProps = {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function FriendCard({
  userId,
  name,
  profileImageUrl,
  isFavorite,
  onToggleFavorite,
}: FriendCardProps) {
  return (
    <div className="flex min-h-12 items-center gap-1 bg-surface">
      <Link
        href={`/friends/${userId}`}
        aria-label={`${name} 상세 보기`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div
          aria-hidden="true"
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[35%] bg-background-subtle"
        >
          {profileImageUrl && (
            <Image src={profileImageUrl} alt="" fill sizes="48px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] leading-6 font-medium text-foreground">{name}</p>
          {/* TODO: 백엔드 생일 데이터 완성 후 생일 및 D-day 정보 표시 */}
        </div>
      </Link>
      <button
        type="button"
        aria-label={`${name} 즐겨찾기 ${isFavorite ? "해제" : "설정"}`}
        aria-pressed={isFavorite}
        onClick={onToggleFavorite}
        className={`touch-target mr-2 flex shrink-0 items-center justify-center border-0 bg-transparent p-0 transition-colors ${
          isFavorite ? "text-primary" : "text-muted"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
          <path
            d="m12 2.75 2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.32l-5.7 3 1.09-6.36-4.62-4.5 6.38-.93L12 2.75Z"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
