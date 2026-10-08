// 선호 관심사를 선택하는 세 번째 온보딩 단계 컴포넌트
"use client";

import ActionButton from "@/components/common/ActionButton";
import PageIntro from "@/components/common/PageIntro";
import { MAX_INTEREST_SELECTIONS, useOnboarding } from "@/contexts/OnboardingContext";

// TODO: 관심사 카테고리 조회 API 연동 후 응답 데이터로 교체
const interestOptions = [
  "패션",
  "뷰티·향수",
  "커피·차",
  "디저트·베이킹",
  "홈·인테리어",
  "캠핑·아웃도어",
  "운동·러닝",
  "게임",
  "책",
  "음악",
  "반려동물",
  "여행",
  "문구·굿즈",
  "테크·가전",
  "주류",
] as const;

export default function OnboardingPreferenceStep() {
  const { state, toggleInterest } = useOnboarding();
  const { interests } = state.formData;
  const isSelectionLimitReached = interests.length >= MAX_INTEREST_SELECTIONS;

  const handleNext = () => {
    // TODO: 네 번째 온보딩 단계 구현 후 다음 단계로 이동 처리
  };

  return (
    <main className="page-content flex min-h-full flex-1 flex-col overflow-y-auto bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <header className="flex shrink-0 justify-end pt-6">
        <p className="text-body-sm font-bold" aria-label="온보딩 4단계 중 3단계">
          3 / 4
        </p>
      </header>

      <div className="mt-5">
        <PageIntro
          title={
            <>
              요즘 관심사가 있다면
              <br />
              골라주세요.
            </>
          }
          description="없다면 지금은 넘어가도 좋아요."
        />
      </div>

      <fieldset className="mt-5">
        <legend className="text-body font-bold">
          관심사 ({MAX_INTEREST_SELECTIONS}개까지 선택 가능)
        </legend>

        <div className="mt-3 flex flex-wrap gap-2">
          {interestOptions.map((interest) => {
            const isSelected = interests.includes(interest);
            const isDisabled = isSelectionLimitReached && !isSelected;

            return (
              <label
                key={interest}
                className={isDisabled ? "cursor-not-allowed" : "cursor-pointer"}
              >
                <input
                  type="checkbox"
                  name="interests"
                  value={interest}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggleInterest(interest)}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 items-center justify-center rounded-full border border-border-strong bg-background px-4 text-body transition-colors peer-checked:border-primary peer-checked:bg-primary peer-disabled:opacity-40 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground">
                  {interest}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <ActionButton onClick={handleNext} className="mt-5 shrink-0">
        <strong className="font-bold">다음</strong>
      </ActionButton>

      <p className="mt-3 text-center text-body-sm text-info">
        고른 관심사는 AI와 대화하면서 계속 다듬어져요.
      </p>
    </main>
  );
}
