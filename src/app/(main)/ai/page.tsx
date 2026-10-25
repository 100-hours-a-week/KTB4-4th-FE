// AI 대화 시작 정보를 화면 콘텐츠에 전달하는 페이지

import AiConversationContent from "@/components/chat/AiConversationContent";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 대화",
};

type AiPageProps = {
  searchParams: Promise<{
    conversationId?: string;
  }>;
};

export default async function AiPage({ searchParams }: AiPageProps) {
  const { conversationId } = await searchParams;

  return <AiConversationContent conversationId={conversationId} />;
}
