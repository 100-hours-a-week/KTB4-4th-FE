// 추천에서 제외할 항목을 선택하는 네 번째 온보딩 단계 컴포넌트
"use client";

import AvoidanceSelectionStep from "@/components/preferences/AvoidanceSelectionStep";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function OnboardingAvoidanceStep() {
  const { state, toggleAvoidance, goToReview } = useOnboarding();

  return (
    <AvoidanceSelectionStep
      selectedCodes={{
        allergyCodes: state.formData.allergyCodes,
        giftExclusionCodes: state.formData.giftExclusionCodes,
      }}
      stepIndicator="4 / 4"
      stepAriaLabel="온보딩 4단계 중 4단계"
      actionLabel="다음"
      onToggle={toggleAvoidance}
      onAction={goToReview}
    />
  );
}
