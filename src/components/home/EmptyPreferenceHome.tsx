// 취향 데이터가 없는 사용자에게 AI 대화를 안내하는 메인 콘텐츠

"use client";

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
        {/* TODO: 메인 페이지 일러스트 확정 후 회색 영역을 실제 이미지로 교체 */}
        <div
          role="img"
          aria-label="취향 찾기 안내 일러스트"
          className="aspect-[16/9] w-full rounded-sm bg-disabled"
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
