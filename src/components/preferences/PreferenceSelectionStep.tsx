// 선호 관심사 선택 화면의 공용 레이아웃과 입력 UI

"use client";

import ActionButton from "@/components/common/ActionButton";
import PageIntro from "@/components/common/PageIntro";
import {
  INTEREST_CATEGORY_OPTIONS,
  MAX_INTEREST_SELECTIONS,
  type InterestCategoryCode,
} from "@/lib/onboardingOptions";

interface PreferenceSelectionStepProps {
  selectedCodes: InterestCategoryCode[];
  stepIndicator: string;
  stepAriaLabel: string;
  actionLabel: string;
  onToggle: (code: InterestCategoryCode) => void;
  onAction: () => void;
}

export default function PreferenceSelectionStep({
  selectedCodes,
  stepIndicator,
  stepAriaLabel,
  actionLabel,
  onToggle,
  onAction,
}: PreferenceSelectionStepProps) {
  const isSelectionLimitReached = selectedCodes.length >= MAX_INTEREST_SELECTIONS;

  return (
    <main className="page-content flex min-h-full flex-1 flex-col overflow-y-auto bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <header className="flex shrink-0 justify-end pt-6">
        <p className="text-body-sm font-bold" aria-label={stepAriaLabel}>
          {stepIndicator}
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
          {INTEREST_CATEGORY_OPTIONS.map(({ code, label }) => {
            const isSelected = selectedCodes.includes(code);
            const isDisabled = isSelectionLimitReached && !isSelected;

            return (
              <label key={code} className={isDisabled ? "cursor-not-allowed" : "cursor-pointer"}>
                <input
                  type="checkbox"
                  name="interests"
                  value={code}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => onToggle(code)}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 items-center justify-center rounded-full border border-border-strong bg-background px-4 text-body transition-colors peer-checked:border-primary peer-checked:bg-primary peer-disabled:opacity-40 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground">
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <ActionButton onClick={onAction} className="mt-5 shrink-0">
        <strong className="font-bold">{actionLabel}</strong>
      </ActionButton>

      <p className="mt-3 text-center text-body-sm text-info">
        고른 관심사는 AI와 대화하면서 계속 다듬어져요.
      </p>
    </main>
  );
}
