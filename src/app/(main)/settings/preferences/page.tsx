// 저장된 취향 데이터 조회와 수정을 제공하는 설정 페이지

import SavedPreferencesFlow from "@/components/preferences/SavedPreferencesFlow";

interface SavedPreferencesPageProps {
  searchParams: Promise<{
    step?: string | string[];
  }>;
}

export default async function SavedPreferencesPage({ searchParams }: SavedPreferencesPageProps) {
  const stepParam = (await searchParams).step;
  const currentStep = stepParam === "avoidance" ? "avoidance" : "preference";

  return <SavedPreferencesFlow currentStep={currentStep} />;
}
