// 현재 상태에 맞는 온보딩 단계 컴포넌트를 표시하는 흐름 제어 컴포넌트
"use client";

import { useOnboarding } from "@/contexts/OnboardingContext";

import OnboardingAvoidanceStep from "./OnboardingAvoidanceStep";
import OnboardingIntroStep from "./OnboardingIntroStep";
import OnboardingPreferenceStep from "./OnboardingPreferenceStep";
import OnboardingProfileStep from "./OnboardingProfileStep";
import PrivacyConsentStep from "./PrivacyConsentStep";

export default function OnboardingFlow() {
  const { state, isHydrated } = useOnboarding();

  if (!isHydrated) {
    return <main className="min-h-full flex-1 bg-background" aria-busy="true" />;
  }

  if (state.phase === "privacy-consent") {
    return <PrivacyConsentStep />;
  }

  switch (state.currentStep) {
    case 1:
      return <OnboardingIntroStep />;
    case 2:
      return <OnboardingProfileStep />;
    case 3:
      return <OnboardingPreferenceStep />;
    case 4:
      return <OnboardingAvoidanceStep />;
  }
}
