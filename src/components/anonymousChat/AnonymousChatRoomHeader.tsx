// 채팅방의 뒤로 가기·대화 상대 이름·대화 종류·메뉴 버튼을 표시하는 전용 헤더
"use client";

import Image from "next/image";
import Link from "next/link";

import AnonymousChatRoomMenu from "@/components/anonymousChat/AnonymousChatRoomMenu";
import type { AnonymousChatType } from "@/lib/api/anonymousChats";

type AnonymousChatRoomHeaderProps = {
  counterpartName: string;
  type: AnonymousChatType;
  listHref: string;
  onReport: () => void;
  onLeave: () => void;
};

const CHAT_TYPE_LABELS: Record<AnonymousChatType, string> = {
  SENT: "내가 물어본 대화",
  RECEIVED: "나에게 물어본 대화",
};

export default function AnonymousChatRoomHeader({
  counterpartName,
  type,
  listHref,
  onReport,
  onLeave,
}: AnonymousChatRoomHeaderProps) {
  return (
    <header className="grid h-[60px] shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-surface px-page">
      <Link
        href={listHref}
        aria-label="뒤로 가기"
        className="touch-target flex items-center justify-start border-0 bg-transparent p-0 text-foreground"
      >
        <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} priority />
      </Link>

      <div className="min-w-0 text-center">
        <h1 className="truncate text-heading-3 font-bold text-foreground">{counterpartName}</h1>
        <p className="mt-0.5 text-caption text-muted">{CHAT_TYPE_LABELS[type]}</p>
      </div>

      <AnonymousChatRoomMenu onReport={onReport} onLeave={onLeave} />
    </header>
  );
}
