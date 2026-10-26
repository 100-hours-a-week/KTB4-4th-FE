// D-7 이내 친구 생일과 선물 추천 이동 버튼을 표시하는 이벤트 영역

import Image from "next/image";
import Link from "next/link";

import type { UpcomingBirthday } from "@/lib/upcomingBirthdays";

type UpcomingBirthdaySectionProps = {
  friends: readonly UpcomingBirthday[];
};

function UpcomingBirthdayCard({ friend }: { friend: UpcomingBirthday }) {
  const [, month, day] = friend.birthDate.split("-");
  const birthdayLabel = `${Number(month)}월 ${Number(day)}일 · 생일 🎂`;

  return (
    <li className="flex min-h-20 items-center gap-4 py-2">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[35%] bg-background-subtle">
        {friend.profileImageUrl && (
          <Image
            src={friend.profileImageUrl}
            alt={`${friend.name} 프로필 이미지`}
            fill
            sizes="64px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] leading-6 font-bold text-foreground">{friend.name}</p>
        <p className="mt-0.5 truncate whitespace-nowrap text-body text-birthday">{birthdayLabel}</p>
      </div>

      <Link
        href={`/products?targetType=FRIEND&targetUserId=${friend.userId}`}
        aria-label={`${friend.name}님에게 선물하기`}
        className="inline-flex w-fit shrink-0 items-center justify-center rounded-full border border-birthday bg-transparent px-3 py-1.5 text-body-sm font-medium text-birthday transition-colors hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        선물하기
      </Link>
    </li>
  );
}

export default function UpcomingBirthdaySection({ friends }: UpcomingBirthdaySectionProps) {
  if (friends.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="upcoming-birthday-title" className="mt-5">
      <h2 id="upcoming-birthday-title" className="text-heading-2 font-bold text-foreground">
        다가오는 생일
      </h2>
      <ul className="mt-3 flex flex-col gap-1">
        {friends.map((friend) => (
          <UpcomingBirthdayCard key={friend.userId} friend={friend} />
        ))}
      </ul>
    </section>
  );
}
