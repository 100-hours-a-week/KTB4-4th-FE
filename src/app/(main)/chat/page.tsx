// 내가 물어본 대화와 나에게 물어본 대화 목록을 표시하는 페이지

import AnonymousChatsPageContent from "@/components/anonymousChat/AnonymousChatsPageContent";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대화",
};

type ChatPageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { tab } = await searchParams;

  return <AnonymousChatsPageContent initialType={tab === "received" ? "RECEIVED" : "SENT"} />;
}
