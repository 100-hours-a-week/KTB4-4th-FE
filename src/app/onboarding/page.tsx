// 서비스의 주요 기능을 소개하는 첫 번째 온보딩 페이지
"use client";

import { useRouter } from "next/navigation";

import ActionButton from "@/components/common/ActionButton";
import PageIntro from "@/components/common/PageIntro";

export default function OnboardingPage() {
  const router = useRouter();

  const handleNext = () => {
    router.push("/onboarding/profile");
  };

  return (
    <main className="page-content flex min-h-full flex-1 flex-col overflow-y-auto bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <header className="flex shrink-0 justify-end pt-6">
        <p className="text-body-sm font-bold" aria-label="온보딩 4단계 중 1단계">
          1 / 4
        </p>
      </header>

      {/* TODO: 서비스 UI 이미지가 준비되면 실제 이미지로 교체 */}
      <div
        role="img"
        aria-label="서비스 화면 이미지 준비 중"
        className="mt-5 aspect-[11/12] w-full shrink-0 rounded-sm border border-border-strong bg-background-subtle"
      />

      <PageIntro
        title={
          <>
            대화를 통해
            <br />
            나와 친구의 취향을 발견해 보세요.
          </>
        }
        description="니쥬가 어울리는 선물을 추천해 드려요."
      />

      <ActionButton onClick={handleNext} className="mt-5 shrink-0">
        <strong className="font-bold">다음</strong>
      </ActionButton>
    </main>
  );
}
