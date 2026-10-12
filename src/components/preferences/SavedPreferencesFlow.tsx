// 설정에서 저장된 선호·비선호 관심사를 조회하고 수정하는 화면 흐름

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AvoidanceSelectionStep from "@/components/preferences/AvoidanceSelectionStep";
import PreferenceSelectionStep from "@/components/preferences/PreferenceSelectionStep";
import type { GiftPreferencesData } from "@/lib/api/giftPreferences";
import {
  MAX_INTEREST_SELECTIONS,
  type AllergyCode,
  type AvoidanceCode,
  type GiftExclusionCode,
  type InterestCategoryCode,
} from "@/lib/onboardingOptions";

type PreferencesStep = "preference" | "avoidance";
type AvoidanceCategory = "allergyCodes" | "giftExclusionCodes";

interface SavedPreferencesFlowProps {
  currentStep: PreferencesStep;
  initialPreferences: GiftPreferencesData;
}

export default function SavedPreferencesFlow({
  currentStep,
  initialPreferences,
}: SavedPreferencesFlowProps) {
  const router = useRouter();
  const [interestCategoryCodes, setInterestCategoryCodes] = useState<InterestCategoryCode[]>(() =>
    initialPreferences.exists ? [...initialPreferences.interestCategoryCodes] : [],
  );
  const [avoidanceCodes, setAvoidanceCodes] = useState<{
    allergyCodes: AllergyCode[];
    giftExclusionCodes: GiftExclusionCode[];
  }>(() => ({
    allergyCodes: initialPreferences.exists ? [...initialPreferences.allergyCodes] : [],
    giftExclusionCodes: initialPreferences.exists ? [...initialPreferences.giftExclusionCodes] : [],
  }));

  const handleInterestToggle = (code: InterestCategoryCode) => {
    setInterestCategoryCodes((currentCodes) =>
      currentCodes.includes(code)
        ? currentCodes.filter((currentCode) => currentCode !== code)
        : currentCodes.length < MAX_INTEREST_SELECTIONS
          ? [...currentCodes, code]
          : currentCodes,
    );
  };

  const handleAvoidanceToggle = (category: AvoidanceCategory, code: AvoidanceCode) => {
    setAvoidanceCodes((currentCodes) => {
      const selectedCodes = currentCodes[category] as AvoidanceCode[];
      const nextCodes = selectedCodes.includes(code)
        ? selectedCodes.filter((selectedCode) => selectedCode !== code)
        : [...selectedCodes, code];

      return { ...currentCodes, [category]: nextCodes };
    });
  };

  const handleUpdate = () => {
    // TODO: 취향 데이터 수정 API 연동
  };

  if (currentStep === "avoidance") {
    return (
      <AvoidanceSelectionStep
        selectedCodes={avoidanceCodes}
        stepIndicator="2 / 2"
        stepAriaLabel="저장된 취향 데이터 2단계 중 2단계"
        actionLabel="수정하기"
        onToggle={handleAvoidanceToggle}
        onAction={handleUpdate}
      />
    );
  }

  return (
    <PreferenceSelectionStep
      selectedCodes={interestCategoryCodes}
      stepIndicator="1 / 2"
      stepAriaLabel="저장된 취향 데이터 2단계 중 1단계"
      actionLabel="다음"
      onToggle={handleInterestToggle}
      onAction={() => router.push("/settings/preferences?step=avoidance")}
    />
  );
}
