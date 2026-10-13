// 입력한 온보딩 정보를 확인하고 서비스 시작을 안내하는 완료 화면
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ActionButton from "@/components/common/ActionButton";
import PageIntro from "@/components/common/PageIntro";
import { useOnboarding, type OnboardingStep } from "@/contexts/OnboardingContext";
import { ApiRequestError } from "@/lib/api/client";
import { completeOnboarding } from "@/lib/api/completeOnboarding";

import type { ReactNode } from "react";

const formatBirthDate = (digits: string) => {
  if (digits.length !== 8) {
    return "미입력";
  }

  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
};

const formatBirthDateForApi = (digits: string) =>
  `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;

// TODO: 온보딩 정보 조회 API 연동 후 Context 대신 API 응답으로 요약 정보 표시
export default function OnboardingReview() {
  const router = useRouter();
  const { state, goToStep, resetOnboarding } = useOnboarding();
  const [isSaving, setIsSaving] = useState(false);
  const { gender, birthDateDigits, interestCategoryCodes, allergyCodes, giftExclusionCodes } =
    state.formData;
  const avoidanceCount = allergyCodes.length + giftExclusionCodes.length;
  const genderLabel = gender === "male" ? "남성" : gender === "female" ? "여성" : "미입력";

  const summaryItems: Array<{
    label: string;
    value: ReactNode;
    step: OnboardingStep;
  }> = [
    {
      label: "기본 정보",
      value: `${genderLabel} · ${formatBirthDate(birthDateDigits)}`,
      step: 2,
    },
    {
      label: "관심 카테고리",
      value: (
        <>
          <span className="text-info">{interestCategoryCodes.length}</span>개 선택
        </>
      ),
      step: 3,
    },
    {
      label: "제외 조건",
      value: (
        <>
          <span className="text-info">{avoidanceCount}</span>개 등록
        </>
      ),
      step: 4,
    },
  ];

  const handleStart = async () => {
    if (isSaving) {
      return;
    }

    if (!gender || birthDateDigits.length !== 8) {
      goToStep(2);
      return;
    }

    setIsSaving(true);

    try {
      await completeOnboarding({
        gender: gender === "male" ? "MALE" : "FEMALE",
        birthDate: formatBirthDateForApi(birthDateDigits),
        interestCategoryCodes,
        allergyCodes,
        giftExclusionCodes,
      });
      resetOnboarding();
      router.replace("/");
    } catch (error) {
      router.replace(
        error instanceof ApiRequestError && error.status === 401 ? "/login" : "/error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="page-content flex min-h-full flex-1 flex-col overflow-y-auto bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <div className="pt-16">
        <PageIntro
          title={
            <>
              준비됐어요.
              <br />
              이제 대화해 볼까요?
            </>
          }
          description="니쥬와 대화하며 나만의 취향을 찾아나가요."
        />
      </div>

      <section aria-labelledby="onboarding-summary-title" className="mt-5">
        <h2 id="onboarding-summary-title" className="text-body-lg font-bold">
          입력한 내용
        </h2>

        <div className="mt-3 flex flex-col gap-3">
          {summaryItems.map(({ label, value, step }) => (
            <button
              key={label}
              type="button"
              onClick={() => goToStep(step)}
              aria-label={`${label} 수정`}
              className="flex min-h-16 w-full cursor-pointer items-center justify-between rounded-sm border border-border-strong bg-background px-5 text-left text-body-lg text-foreground transition-colors hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <strong className="font-bold">{label}</strong>
              <span>{value}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5 rounded-md bg-background-subtle px-5 py-4">
        <p className="text-body font-bold text-info">지금은 기본 정보만 알고 있어요.</p>
        <p className="mt-1 text-body text-foreground">입력한 내용은 클릭하여 수정할 수 있어요.</p>
      </div>

      <ActionButton
        isLoading={isSaving}
        loadingText="저장 중..."
        onClick={handleStart}
        className="mt-5 shrink-0"
      >
        <strong className="font-bold">Need U 시작하기</strong>
      </ActionButton>
    </main>
  );
}
