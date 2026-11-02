// 내가 물어본 대화와 나에게 물어본 대화 목록을 표시하는 페이지

import { Suspense } from "react";

import AnonymousChatsPageContent from "@/components/anonymousChat/AnonymousChatsPageContent";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대화",
};

// 탭 값을 클라이언트에서 URL로 읽으므로 useSearchParams 사용 구간을 Suspense로 감쌈
export default function ChatPage() {
  return (
    <Suspense>
      <AnonymousChatsPageContent />
    </Suspense>
  );
}
