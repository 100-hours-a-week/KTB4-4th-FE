// 단일 경로에서 개인정보 동의와 온보딩 단계를 제공하는 페이지

import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { OnboardingProvider } from "@/contexts/OnboardingContext";

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
