// 선택한 익명 채팅방의 대화와 메시지 입력창을 표시하는 페이지

import { notFound } from "next/navigation";

import AnonymousChatRoomContent from "@/components/anonymousChat/AnonymousChatRoomContent";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대화",
};

type ChatRoomPageProps = {
  params: Promise<{ chatId: string }>;
};

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { chatId } = await params;
  const parsedChatId = Number(chatId);

  if (!Number.isSafeInteger(parsedChatId) || parsedChatId <= 0) {
    notFound();
  }

  return <AnonymousChatRoomContent key={parsedChatId} chatId={parsedChatId} />;
}
