// 저장된 온보딩 취향 데이터 수정을 위한 클라이언트 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AllergyCode, GiftExclusionCode, InterestCategoryCode } from "@/lib/onboardingOptions";

export interface UpdateGiftPreferencesRequest {
  interestCategoryCodes: InterestCategoryCode[];
  allergyCodes: AllergyCode[];
  giftExclusionCodes: GiftExclusionCode[];
}

interface UpdateGiftPreferencesResponse {
  message: string;
  data: UpdateGiftPreferencesRequest;
}

interface UpdateGiftPreferencesErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  404: "사용자 정보를 찾을 수 없습니다.",
  422: "입력 값이 유효하지 않습니다. 입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: UpdateGiftPreferencesErrorResponse | null,
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

export async function updateGiftPreferences(payload: UpdateGiftPreferencesRequest) {
  const response = await apiFetch(API_ENDPOINTS.users.giftPreferences, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as UpdateGiftPreferencesErrorResponse | null;
    const message =
      errorResponse?.message ??
      DEFAULT_ERROR_MESSAGES[response.status] ??
      "저장된 취향 데이터를 수정하지 못했습니다.";

    throw new ApiRequestError(
      message,
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as UpdateGiftPreferencesResponse;
  return data;
}
