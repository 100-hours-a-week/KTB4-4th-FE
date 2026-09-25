// 친구 상세 정보를 조회하고 화면에 표시하는 클라이언트 컴포넌트
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ApiRequestError } from "@/lib/api/client";
import { getFriendDetail, type FriendDetail } from "@/lib/api/friends";

type FriendDetailContentProps = {
  userId: number;
};

export default function FriendDetailContent({ userId }: FriendDetailContentProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<FriendDetail | null>(null);
  const isMountedRef = useRef(false);
  const requestedUserIdRef = useRef<number | null>(null);

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
    <section aria-labelledby="friend-name" className="flex flex-col items-center pt-12 text-center">
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
      {/* TODO: 백엔드 생일 정보 연동 확정 후 실제 생일 정보 표시 */}
      <p className="mt-2 text-body font-semibold text-muted">생일 정보 없음</p>
      <div className="mt-6 w-full max-w-[360px]">
        <Link
          href={`/products?targetType=FRIEND&targetUserId=${friend.id}`}
          className="flex h-12 w-full items-center justify-center rounded-[6px] bg-primary px-4 text-center text-[15px] leading-[26px] text-on-primary"
        >
          <span className="font-semibold">{friend.nickname}에게 선물하기</span>
        </Link>
      </div>
    </section>
  );
}
