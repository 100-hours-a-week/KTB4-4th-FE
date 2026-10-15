// 친구 상세 정보를 조회하고 화면에 표시하는 클라이언트 컴포넌트
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import AiSummarySection from "@/components/common/AiSummarySection";
import KeywordSection from "@/components/common/KeywordSection";
import FriendPokeButton from "@/components/friends/FriendPokeButton";
import { useFriendDetailContext } from "@/contexts/FriendDetailContext";
import type { FriendDetail } from "@/lib/api/friends";

type FriendDetailContentProps = {
  userId: number;
  initialFriend: FriendDetail;
};

function parseBirthday(birthDate: string | null) {
  if (!birthDate) {
    return null;
  }

  const match = birthDate.match(/^\d{4}-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(2000, month - 1, day));

  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return { month, day };
}

function getDaysUntilBirthday(month: number, day: number) {
  const today = new Date();
  const todayAtUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  let birthdayAtUtc = Date.UTC(today.getFullYear(), month - 1, day);

  if (birthdayAtUtc < todayAtUtc) {
    birthdayAtUtc = Date.UTC(today.getFullYear() + 1, month - 1, day);
  }

  return Math.round((birthdayAtUtc - todayAtUtc) / (1000 * 60 * 60 * 24));
}

export default function FriendDetailContent({ userId, initialFriend }: FriendDetailContentProps) {
  const { friend: friendDetail, initializeFriend } = useFriendDetailContext();
  const friend = friendDetail?.id === userId ? friendDetail : initialFriend;
  const birthday = friend ? parseBirthday(friend.birthDate) : null;
  const daysUntilBirthday = birthday ? getDaysUntilBirthday(birthday.month, birthday.day) : null;

  useEffect(() => {
    initializeFriend(initialFriend);
  }, [initialFriend, initializeFriend]);

  return (
    <section
      aria-labelledby="friend-name"
      className="flex flex-col items-center pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center"
    >
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-background-subtle">
        {friend.profileImageUrl && (
          <Image
            src={friend.profileImageUrl}
            alt={`${friend.nickname} 프로필 이미지`}
            fill
            sizes="128px"
            className="object-cover"
          />
        )}
      </div>
      <h1 id="friend-name" className="mt-4 text-heading-1 font-bold text-foreground">
        {friend.nickname}
      </h1>
      {birthday && daysUntilBirthday !== null && (
        <p className="mt-2 flex items-center gap-1 text-body font-semibold text-birthday">
          <span>
            {birthday.month}월 {birthday.day}일
          </span>
          {daysUntilBirthday === 0 ? (
            <span>· 생일 🎂</span>
          ) : (
            daysUntilBirthday <= 7 && <span>· D-{daysUntilBirthday} 🎂</span>
          )}
        </p>
      )}
      <div className="mt-4 w-full max-w-[360px]">
        <Link
          href={`/products?targetType=FRIEND&targetUserId=${friend.id}`}
          className="flex h-12 w-full items-center justify-center rounded-[6px] bg-primary px-4 text-center text-[15px] leading-[26px] text-on-primary"
        >
          <span className="font-semibold">{friend.nickname}님에게 선물하기</span>
        </Link>
      </div>
      {friend.tasteAnalysisCompleted ? (
        <div className="mt-8 flex w-full max-w-[360px] flex-col gap-8 text-left">
          <KeywordSection
            category="취향"
            nickname={friend.nickname}
            keywords={friend.tasteKeywords}
          />
          <KeywordSection
            category="관심사"
            nickname={friend.nickname}
            keywords={friend.interestKeywords}
          />
          <AiSummarySection nickname={friend.nickname} summary={friend.interestSummary} />
        </div>
      ) : (
        <div className="mt-8 flex w-full max-w-[360px] justify-center">
          <FriendPokeButton userId={userId} nickname={friend.nickname} />
        </div>
      )}
    </section>
  );
}
