// 취향 데이터가 없는 사용자에게 AI 대화를 안내하는 메인 콘텐츠

"use client";

import Image from "next/image";

import ActionButton from "@/components/common/ActionButton";
import PageIntro from "@/components/common/PageIntro";
import useAiConversationStart from "@/hooks/useAiConversationStart";

type EmptyPreferenceHomeProps = {
  title: string;
  description: string;
};

export default function EmptyPreferenceHome({ title, description }: EmptyPreferenceHomeProps) {
  const {
    errorMessage,
    isStartingConversation,
    isUnavailable,
    retryAfterSeconds,
    startConversation,
  } = useAiConversationStart();

  return (
    <>
      <PageIntro title={title} description={description} />

      <section aria-label="취향 찾기 안내" className="mt-5 rounded-sm bg-background-subtle p-4">
        <Image
          src="/images/NeedU_logo.png"
          alt="NeedU 서비스 로고"
          width={1005}
          height={261}
          sizes="(max-width: 430px) 100vw, 430px"
          className="mx-auto h-auto w-[80%] rounded-sm object-contain"
          priority
        />

        <ActionButton
          onClick={() => void startConversation()}
          disabled={isUnavailable}
          isLoading={isStartingConversation}
          loadingText="대화를 준비하고 있어요..."
          className="mt-5 font-bold"
        >
          니쥬와 대화하고 취향 찾기
        </ActionButton>

        {errorMessage && (
          <p role="alert" className="mt-2 text-center text-body-sm text-danger">
            {errorMessage}
            {retryAfterSeconds > 0 && ` (${retryAfterSeconds}초 후 다시 시도해 주세요.)`}
          </p>
        )}
      </section>
    </>
  );
}
