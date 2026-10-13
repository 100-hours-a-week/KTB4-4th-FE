// 저장된 취향 데이터 조회와 수정을 제공하는 설정 페이지

import { redirect } from "next/navigation";

import SavedPreferencesFlow from "@/components/preferences/SavedPreferencesFlow";
import { getGiftPreferences } from "@/lib/api/giftPreferences";
import { ServerApiError } from "@/lib/api/serverClient";

interface SavedPreferencesPageProps {
  searchParams: Promise<{
    step?: string | string[];
  }>;
}

async function getGiftPreferencesOrRedirect() {
  try {
    return await getGiftPreferences();
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    redirect("/error");
  }
}

export default async function SavedPreferencesPage({ searchParams }: SavedPreferencesPageProps) {
  const stepParam = (await searchParams).step;
  const currentStep = stepParam === "avoidance" ? "avoidance" : "preference";
  const initialPreferences = await getGiftPreferencesOrRedirect();

  return <SavedPreferencesFlow currentStep={currentStep} initialPreferences={initialPreferences} />;
}
