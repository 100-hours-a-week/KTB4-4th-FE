// 서비스의 주요 기능을 소개하는 첫 번째 온보딩 단계 컴포넌트
"use client";

import Image from "next/image";

import onboardingIntroImage from "@/assets/images/onboarding-intro.png";
import ActionButton from "@/components/common/ActionButton";
import PageIntro from "@/components/common/PageIntro";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function OnboardingIntroStep() {
  const { goToStep } = useOnboarding();

  return (
    <main className="page-content flex min-h-full flex-1 flex-col overflow-y-auto bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <header className="flex shrink-0 justify-end pt-6">
        <p className="text-body-sm font-bold" aria-label="온보딩 4단계 중 1단계">
          1 / 4
        </p>
      </header>

      <Image
        src={onboardingIntroImage}
        alt="니쥬와 나눈 대화로 발견한 나의 취향 프로필 카드 예시"
        sizes="(max-width: 430px) 100vw, 430px"
        className="mt-5 h-auto w-full shrink-0"
        priority
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

      <ActionButton onClick={() => goToStep(2)} className="mt-5 shrink-0">
        <strong className="font-bold">다음</strong>
      </ActionButton>
    </main>
  );
}
