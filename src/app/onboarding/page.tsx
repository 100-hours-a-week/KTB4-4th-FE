// 단일 경로에서 개인정보 동의와 온보딩 단계를 제공하는 페이지

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { getConsents } from "@/lib/api/consents";
import { LOGIN_SESSION_USER_ID_HEADER } from "@/lib/api/loginSession";
import { ServerApiError } from "@/lib/api/serverClient";

async function getConsentsOrRedirect() {
  try {
    return await getConsents();
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    redirect("/error");
  }
}

export default async function OnboardingPage() {
  const userId = Number((await headers()).get(LOGIN_SESSION_USER_ID_HEADER));

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    redirect("/error");
  }

  const consents = await getConsentsOrRedirect();

  return (
    <OnboardingProvider userId={userId}>
      <OnboardingFlow consents={consents} />
    </OnboardingProvider>
  );
}
