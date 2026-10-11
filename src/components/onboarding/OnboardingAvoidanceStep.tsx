// 추천에서 제외할 항목을 선택하는 네 번째 온보딩 단계 컴포넌트
"use client";

import ActionButton from "@/components/common/ActionButton";
import PageIntro from "@/components/common/PageIntro";
import { useOnboarding, type AvoidanceCategory } from "@/contexts/OnboardingContext";
import {
  ALLERGY_OPTIONS,
  GIFT_EXCLUSION_OPTIONS,
  type AvoidanceCode,
} from "@/lib/onboardingOptions";

const avoidanceGroups: Array<{
  category: AvoidanceCategory;
  label: string;
  options: ReadonlyArray<{ code: AvoidanceCode; label: string }>;
}> = [
  {
    category: "allergyCodes",
    label: "알레르기·못 먹는 것 (선택)",
    options: ALLERGY_OPTIONS,
  },
  {
    category: "giftExclusionCodes",
    label: "받고 싶지 않은 선물 (선택)",
    options: GIFT_EXCLUSION_OPTIONS,
  },
];

export default function OnboardingAvoidanceStep() {
  const { state, toggleAvoidance, goToReview } = useOnboarding();

  const handleNext = () => {
    goToReview();
  };

  return (
    <main className="page-content flex min-h-full flex-1 flex-col overflow-y-auto bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <header className="flex shrink-0 justify-end pt-6">
        <p className="text-body-sm font-bold" aria-label="온보딩 4단계 중 4단계">
          4 / 4
        </p>
      </header>

      <div className="mt-5">
        <PageIntro
          title={
            <>
              이건 빼고
              <br />
              추천해 드릴게요.
            </>
          }
          description="여기서 고른 항목은 추천 결과에서 항상 제외돼요."
        />
      </div>

      <div className="mt-5 flex flex-col gap-6">
        {avoidanceGroups.map(({ category, label, options }) => (
          <fieldset key={category}>
            <legend className="text-body font-bold">{label}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {options.map(({ code, label }) => {
                const isSelected = (state.formData[category] as AvoidanceCode[]).includes(code);

                return (
                  <label key={code} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name={category}
                      value={code}
                      checked={isSelected}
                      onChange={() => toggleAvoidance(category, code)}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-11 items-center justify-center rounded-full border border-border-strong bg-background px-4 text-body transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground">
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <ActionButton onClick={handleNext} className="mt-5 shrink-0">
        <strong className="font-bold">다음</strong>
      </ActionButton>

      <p className="mt-3 text-center text-body-sm text-info">
        입력한 내용은 설정에서 언제든 바꿀 수 있어요.
      </p>
    </main>
  );
}
