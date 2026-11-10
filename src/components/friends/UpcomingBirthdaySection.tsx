// D-7 이내 친구 생일과 선물 추천 이동 버튼을 표시하는 이벤트 영역
"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";

import type { UpcomingFriendEvent } from "@/lib/api/friends";

type UpcomingBirthdaySectionProps = {
  events: readonly UpcomingFriendEvent[];
};

function UpcomingBirthdayCard({ event }: { event: UpcomingFriendEvent }) {
  const { friend } = event;
  const [, month, day] = event.eventDate.split("-");
  const birthdayLabel = `${Number(month)}월 ${Number(day)}일 · 생일 🎂`;

  return (
    <li className="flex min-h-20 items-center gap-4 py-2">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[35%] bg-background-subtle">
        {friend.profileImageUrl && (
          <Image
            src={friend.profileImageUrl}
            alt={`${friend.nickname} 프로필 이미지`}
            fill
            sizes="64px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] leading-6 font-bold text-foreground">
          {friend.nickname}
        </p>
        <p className="mt-0.5 truncate whitespace-nowrap text-body text-birthday">{birthdayLabel}</p>
      </div>

      <Link
        href={`/products?targetType=FRIEND&targetUserId=${friend.userId}`}
        aria-label={`${friend.nickname}님에게 선물하기`}
        className="inline-flex w-fit shrink-0 items-center justify-center rounded-full border border-birthday bg-transparent px-3 py-1.5 text-body-sm font-medium text-birthday transition-colors hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        선물하기
      </Link>
    </li>
  );
}

export default function UpcomingBirthdaySection({ events }: UpcomingBirthdaySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const detailsId = useId();

  return (
    <section aria-labelledby="upcoming-birthday-title" className="mt-5">
      <div className="flex items-center gap-1">
        <h2 id="upcoming-birthday-title" className="text-heading-2 font-bold text-foreground">
          다가오는 생일
        </h2>
        <button
          type="button"
          aria-controls={detailsId}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "다가오는 생일 펼치기" : "다가오는 생일 접기"}
          onClick={() => setIsCollapsed((current) => !current)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-muted transition-colors hover:text-foreground focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-info"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-[var(--duration-base)] ${
              isCollapsed ? "" : "rotate-180"
            }`}
          >
            <path
              d="M5 9L12 16L19 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div id={detailsId} hidden={isCollapsed}>
        {events.length === 0 ? (
          <p className="mt-3 flex min-h-14 items-center justify-center rounded-md bg-background-subtle text-body-sm text-muted">
            친구의 생일이 가까워지면 여기에 표시돼요
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1">
            {events.map((event) => (
              <UpcomingBirthdayCard key={event.friend.userId} event={event} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
