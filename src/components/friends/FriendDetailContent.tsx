// 친구 상세 정보를 조회하고 화면에 표시하는 클라이언트 컴포넌트
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import KeywordSection from "@/components/common/KeywordSection";
import { ApiRequestError } from "@/lib/api/client";
import { getFriendDetail, type FriendDetail } from "@/lib/api/friends";
import { friendPreferenceMock } from "@/mocks/friendDetail";

type FriendDetailContentProps = {
  userId: number;
};

// TODO: 친구 상세 API에 생일 정보가 추가되면 응답 데이터로 교체
const TEMPORARY_BIRTHDAY = {
  month: 10,
  day: 14,
};

function getDaysUntilBirthday(month: number, day: number) {
  const today = new Date();
  const todayAtUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  let birthdayAtUtc = Date.UTC(today.getFullYear(), month - 1, day);

  if (birthdayAtUtc < todayAtUtc) {
    birthdayAtUtc = Date.UTC(today.getFullYear() + 1, month - 1, day);
  }

  return Math.round((birthdayAtUtc - todayAtUtc) / (1000 * 60 * 60 * 24));
}

export default function FriendDetailContent({ userId }: FriendDetailContentProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<FriendDetail | null>(null);
  const isMountedRef = useRef(false);
  const requestedUserIdRef = useRef<number | null>(null);
  const daysUntilBirthday = getDaysUntilBirthday(TEMPORARY_BIRTHDAY.month, TEMPORARY_BIRTHDAY.day);

  useEffect(() => {
    isMountedRef.current = true;

    const loadFriendDetail = async () => {
      try {
        const data = await getFriendDetail(userId);

        if (isMountedRef.current && requestedUserIdRef.current === userId) {
          setFriend(data);
        }
      } catch (error) {
        if (isMountedRef.current && requestedUserIdRef.current === userId) {
          router.replace(
            error instanceof ApiRequestError && error.status === 401 ? "/login" : "/error",
          );
        }
      }
    };

    if (requestedUserIdRef.current !== userId) {
      requestedUserIdRef.current = userId;
      setFriend(null);
      void loadFriendDetail();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [router, userId]);

  if (!friend) {
    return (
      <p role="status" className="pt-12 text-center text-body-sm text-muted">
        친구 정보를 불러오는 중이에요.
      </p>
    );
  }

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
      <p className="mt-2 flex items-center gap-1 text-body font-semibold text-birthday">
        <span>
          {TEMPORARY_BIRTHDAY.month}월 {TEMPORARY_BIRTHDAY.day}일
        </span>
        {daysUntilBirthday === 0 ? (
          <span>· 생일 🎂</span>
        ) : (
          daysUntilBirthday <= 7 && <span>· D-{daysUntilBirthday} 🎂</span>
        )}
      </p>
      <div className="mt-4 w-full max-w-[360px]">
        <Link
          href={`/products?targetType=FRIEND&targetUserId=${friend.id}`}
          className="flex h-12 w-full items-center justify-center rounded-[6px] bg-primary px-4 text-center text-[15px] leading-[26px] text-on-primary"
        >
          <span className="font-semibold">{friend.nickname}님에게 선물하기</span>
        </Link>
      </div>
      <div className="mt-8 flex w-full max-w-[360px] flex-col gap-8 text-left">
        <KeywordSection
          category="취향"
          nickname={friend.nickname}
          keywords={friendPreferenceMock.tasteKeywords}
        />
        <KeywordSection
          category="관심사"
          nickname={friend.nickname}
          keywords={friendPreferenceMock.interestKeywords}
        />
      </div>
    </section>
  );
}
