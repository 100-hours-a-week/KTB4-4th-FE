// 온보딩 전체 입력값 저장 및 완료 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AllergyCode, GiftExclusionCode, InterestCategoryCode } from "@/lib/onboardingOptions";

export type OnboardingGender = "MALE" | "FEMALE";

export interface CompleteOnboardingRequest {
  gender: OnboardingGender;
  birthDate: string;
  interestCategoryCodes: InterestCategoryCode[];
  allergyCodes: AllergyCode[];
  giftExclusionCodes: GiftExclusionCode[];
}

interface CompleteOnboardingResponse {
  message: string;
  data: string;
}

interface CompleteOnboardingErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "필수 약관에 동의해야 합니다.",
  404: "사용자 정보를 찾을 수 없습니다.",
  409: "이미 온보딩이 완료되었습니다.",
  422: "입력 값이 유효하지 않습니다. 입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: CompleteOnboardingErrorResponse | null,
) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");

  if (!retryAfterHeader) {
    return undefined;
  }

  const seconds = Number(retryAfterHeader);

  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds));
  }

  const retryAt = Date.parse(retryAfterHeader);

  if (Number.isNaN(retryAt)) {
    return undefined;
  }

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

export async function completeOnboarding(payload: CompleteOnboardingRequest) {
  const response = await apiFetch(API_ENDPOINTS.users.onboarding, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as CompleteOnboardingErrorResponse | null;
    const message =
      errorResponse?.message ??
      DEFAULT_ERROR_MESSAGES[response.status] ??
      "온보딩 정보를 저장하지 못했습니다.";

    throw new ApiRequestError(
      message,
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as CompleteOnboardingResponse;
  return data;
}
