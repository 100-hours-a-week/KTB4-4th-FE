// 단일 경로에서 개인정보 동의와 온보딩 단계를 제공하는 페이지

import { redirect } from "next/navigation";

import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { getConsents } from "@/lib/api/consents";
import { isOnboardingStatusStep, type OnboardingStatusStep } from "@/lib/api/onboardingStatus";
import { ServerApiError } from "@/lib/api/serverClient";

interface OnboardingPageProps {
  searchParams: Promise<{
    currentStep?: string | string[];
  }>;
}

async function getConsentsOrRedirect(serverStep?: OnboardingStatusStep) {
  if (serverStep && serverStep !== "CONSENTS") {
    return [];
  }

  try {
    return await getConsents();
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    redirect("/error");
  }
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const currentStepParam = (await searchParams).currentStep;
  const serverStep = isOnboardingStatusStep(currentStepParam) ? currentStepParam : undefined;
  const consents = await getConsentsOrRedirect(serverStep);

  return (
    <OnboardingProvider serverStep={serverStep}>
      <OnboardingFlow consents={consents} />
    </OnboardingProvider>
  );
}
