// 현재 상태에 맞는 온보딩 단계 컴포넌트를 표시하는 흐름 제어 컴포넌트
"use client";

import { useOnboarding } from "@/contexts/OnboardingContext";

import OnboardingIntroStep from "./OnboardingIntroStep";
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
    case 4:
      // TODO: 세 번째와 네 번째 단계 구현 후 컴포넌트를 연결하고, 마지막 단계에서 전체 입력 정보를 서버로 전송한 뒤 온보딩 상태 초기화
      return null;
  }
}
