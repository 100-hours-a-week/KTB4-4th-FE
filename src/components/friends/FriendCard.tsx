// 친구의 이름과 상세 페이지 이동 링크를 표시하는 목록 카드

import Image from "next/image";
import Link from "next/link";

type FriendCardProps = {
  userId: number;
  name: string;
  profileImageUrl: string | null;
};

export default function FriendCard({ userId, name, profileImageUrl }: FriendCardProps) {
  return (
    <Link
      href={`/friends/${userId}`}
      aria-label={`${name} 상세 보기`}
      className="flex min-h-12 items-center gap-3 bg-surface"
    >
      <div
        aria-hidden="true"
        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[35%] bg-background-subtle"
      >
        {profileImageUrl && (
          <Image src={profileImageUrl} alt="" fill sizes="48px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[18px] leading-6 font-medium text-foreground">{name}</p>
        {/* TODO: 백엔드 생일 데이터 완성 후 생일 및 D-day 정보 표시 */}
      </div>
    </Link>
  );
}
