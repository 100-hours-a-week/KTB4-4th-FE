// 선호 관심사를 선택하는 세 번째 온보딩 단계 컴포넌트
"use client";

import PreferenceSelectionStep from "@/components/preferences/PreferenceSelectionStep";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function OnboardingPreferenceStep() {
  const { state, toggleInterest, goToStep } = useOnboarding();
  const { interestCategoryCodes } = state.formData;
  return (
    <PreferenceSelectionStep
      selectedCodes={interestCategoryCodes}
      stepIndicator="3 / 4"
      stepAriaLabel="온보딩 4단계 중 3단계"
      actionLabel="다음"
      onToggle={toggleInterest}
      onAction={() => goToStep(4)}
    />
  );
}
