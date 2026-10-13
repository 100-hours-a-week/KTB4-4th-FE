// 친구의 이름과 상세 페이지 이동 링크를 표시하는 목록 카드

import Image from "next/image";
import Link from "next/link";

import FriendFavoriteButton from "@/components/friends/FriendFavoriteButton";

type FriendCardProps = {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  birthDate: string | null;
  isFavorite: boolean;
  isFavoritePending?: boolean;
  isFavoriteDisabled?: boolean;
  onToggleFavorite: () => void;
};

export default function FriendCard({
  userId,
  name,
  profileImageUrl,
  birthDate,
  isFavorite,
  isFavoritePending = false,
  isFavoriteDisabled = false,
  onToggleFavorite,
}: FriendCardProps) {
  const birthdayLabel = birthDate
    ? (() => {
        const [, month, day] = birthDate.split("-");

        return `생일 · ${Number(month)}월 ${Number(day)}일`;
      })()
    : null;

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
          {birthdayLabel && <p className="mt-0.5 text-caption text-muted">{birthdayLabel}</p>}
        </div>
      </Link>
      <FriendFavoriteButton
        name={name}
        isFavorite={isFavorite}
        isPending={isFavoritePending}
        disabled={isFavoriteDisabled}
        onToggle={onToggleFavorite}
        className="mr-2"
      />
    </div>
  );
}
