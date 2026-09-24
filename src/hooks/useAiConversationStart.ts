// AI 대화 시작 요청과 화면 이동 상태를 관리하는 공통 훅
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAiConversationContext } from "@/contexts/AiConversationContext";
import { startAiConversation } from "@/lib/api/aiConversations";
import { ApiRequestError } from "@/lib/api/client";

export default function useAiConversationStart() {
  const router = useRouter();
  const { setConversation } = useAiConversationContext();
  const isRequestingRef = useRef(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const isUnavailable = isStartingConversation || retryAfterSeconds > 0;

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [retryAfterSeconds]);

  const startConversation = useCallback(async () => {
    if (isRequestingRef.current || retryAfterSeconds > 0) return;

    isRequestingRef.current = true;
    setErrorMessage("");
    setIsStartingConversation(true);

    try {
      const conversation = await startAiConversation();
      const { conversationId, status } = conversation;
      const searchParams = new URLSearchParams({
        conversationId: String(conversationId),
        status,
      });

      setConversation(conversation);
      router.push(`/ai?${searchParams.toString()}`);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          router.replace("/login");
          return;
        }

        setErrorMessage(error.message);

        if (error.status === 429) {
          setRetryAfterSeconds(error.retryAfterSeconds ?? 0);
        }

        return;
      }

      setErrorMessage("AI 대화를 시작하지 못했습니다.");
    } finally {
      isRequestingRef.current = false;
      setIsStartingConversation(false);
    }
  }, [retryAfterSeconds, router, setConversation]);

  return {
    errorMessage,
    isStartingConversation,
    isUnavailable,
    retryAfterSeconds,
    startConversation,
  };
}
