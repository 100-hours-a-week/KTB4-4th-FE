// 온보딩 진행 여부 조회 API의 응답 타입과 런타임 검증 함수

export const ONBOARDING_STEPS = ["CONSENTS", "PROFILE", "INTERESTING", "UNWANTED"] as const;

export type OnboardingStatusStep = (typeof ONBOARDING_STEPS)[number];

export type OnboardingStatusData =
  | {
      completed: true;
      currentStep?: OnboardingStatusStep | null;
    }
  | {
      completed: false;
      currentStep: OnboardingStatusStep;
    };

export interface OnboardingStatusResponse {
  message: string;
  data: OnboardingStatusData;
}

export function isOnboardingStatusStep(value: unknown): value is OnboardingStatusStep {
  return ONBOARDING_STEPS.some((step) => step === value);
}

export function isOnboardingStatusResponse(value: unknown): value is OnboardingStatusResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<OnboardingStatusResponse>;

  if (typeof response.message !== "string" || !response.data || typeof response.data !== "object") {
    return false;
  }

  const data = response.data as {
    completed?: unknown;
    currentStep?: unknown;
  };

  if (data.completed === true) {
    return data.currentStep == null || isOnboardingStatusStep(data.currentStep);
  }

  return data.completed === false && isOnboardingStatusStep(data.currentStep);
}
