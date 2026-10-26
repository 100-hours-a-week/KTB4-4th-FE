// 채팅 기능 준비 상태를 안내하는 임시 채팅 페이지

import Image from "next/image";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "채팅",
};

export default function ChatPage() {
  return (
    <main className="page-content flex flex-1 flex-col items-center justify-center bg-background pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center text-foreground">
      <div className="flex flex-col items-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-background-subtle">
          <Image src="/icons/icon-chat.svg" alt="" width={40} height={40} priority />
        </div>
        <h1 className="mt-5 text-heading-2 font-bold">채팅 기능을 준비 중이에요</h1>
        <p className="mt-2 text-body text-foreground-secondary">
          친구와 대화할 수 있는 기능으로 곧 찾아올게요.
        </p>
      </div>
    </main>
  );
}
