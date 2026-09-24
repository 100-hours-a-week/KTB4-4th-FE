// AI 대화 시작 정보를 화면 콘텐츠에 전달하는 페이지

import AiConversationContent from "@/components/chat/AiConversationContent";

type AiPageProps = {
  searchParams: Promise<{
    conversationId?: string;
    status?: string;
  }>;
};

export default async function AiPage({ searchParams }: AiPageProps) {
  const { conversationId, status } = await searchParams;

  return <AiConversationContent conversationId={conversationId} status={status} />;
}
