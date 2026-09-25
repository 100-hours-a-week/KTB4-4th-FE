// 시작 API로 생성하거나 조회한 AI 대화 정보를 공유하는 Context
"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { AiConversation } from "@/lib/api/aiConversations";

type AiConversationContextValue = {
  conversation: AiConversation | null;
  setConversation: (conversation: AiConversation) => void;
};

const AiConversationContext = createContext<AiConversationContextValue | null>(null);

export function AiConversationProvider({ children }: { children: ReactNode }) {
  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const value = useMemo(() => ({ conversation, setConversation }), [conversation]);

  return <AiConversationContext value={value}>{children}</AiConversationContext>;
}

export function useAiConversationContext() {
  const context = useContext(AiConversationContext);

  if (!context) {
    throw new Error("useAiConversationContext는 AiConversationProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
