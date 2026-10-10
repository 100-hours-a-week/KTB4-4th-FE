// 단일 경로에서 개인정보 동의와 온보딩 단계를 제공하는 페이지

import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { isOnboardingStatusStep } from "@/lib/api/onboardingStatus";

interface OnboardingPageProps {
  searchParams: Promise<{
    currentStep?: string | string[];
  }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const currentStepParam = (await searchParams).currentStep;
  const serverStep = isOnboardingStatusStep(currentStepParam) ? currentStepParam : undefined;

  return (
    <OnboardingProvider serverStep={serverStep}>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
