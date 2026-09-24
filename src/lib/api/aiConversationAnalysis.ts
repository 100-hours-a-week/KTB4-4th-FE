// AI 대화 취향 분석 결과 생성·재조회·수정·확정 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface AiPreferenceAnalysisKeyword {
  value: string;
  score: number;
}

export interface AiPreferenceAnalysisData {
  summary: string;
  keywords: {
    taste: AiPreferenceAnalysisKeyword[];
    interest: AiPreferenceAnalysisKeyword[];
  };
  correctionAvailable: boolean;
}

export interface UpdateAiPreferenceAnalysisRequest {
  summary: string;
  keywords: {
    taste: string[];
    interest: string[];
  };
}

interface AiPreferenceAnalysisResponse {
  message: string;
  data: AiPreferenceAnalysisData;
}

interface AiPreferenceAnalysisErrorResponse {
  message?: string;
  data?: null;
}

interface UpdateAiPreferenceAnalysisParams extends UpdateAiPreferenceAnalysisRequest {
  conversationId: number;
}

export interface ConfirmAiPreferenceAnalysisData {
  isRecommendationCompleted: boolean;
}

interface ConfirmAiPreferenceAnalysisResponse {
  message: string;
  data: ConfirmAiPreferenceAnalysisData;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "해당 AI 대화에 접근할 수 없습니다.",
  404: "AI 대화를 찾을 수 없습니다.",
  409: "취향 분석을 생성할 수 없는 상태입니다.",
  422: "입력값이 유효하지 않습니다. 입력 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

export async function requestAiPreferenceAnalysis(conversationId: number) {
  const response = await apiFetch(API_ENDPOINTS.ai.conversationAnalysis(conversationId), {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AiPreferenceAnalysisErrorResponse | null;
    const message =
      errorResponse?.message ??
      DEFAULT_ERROR_MESSAGES[response.status] ??
      "취향 분석 결과를 불러오지 못했습니다.";

    throw new ApiRequestError(message, response.status);
  }

  const { data } = (await response.json()) as AiPreferenceAnalysisResponse;
  return data;
}

export async function updateAiPreferenceAnalysis({
  conversationId,
  summary,
  keywords,
}: UpdateAiPreferenceAnalysisParams) {
  const response = await apiFetch(API_ENDPOINTS.ai.conversationAnalysis(conversationId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary, keywords } satisfies UpdateAiPreferenceAnalysisRequest),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AiPreferenceAnalysisErrorResponse | null;
    const message =
      errorResponse?.message ??
      DEFAULT_ERROR_MESSAGES[response.status] ??
      "취향 분석 결과를 수정하지 못했습니다.";

    throw new ApiRequestError(message, response.status);
  }

  const { data } = (await response.json()) as AiPreferenceAnalysisResponse;
  return data;
}

export async function confirmAiPreferenceAnalysis(conversationId: number) {
  const response = await apiFetch(API_ENDPOINTS.ai.conversationConfirmation(conversationId), {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AiPreferenceAnalysisErrorResponse | null;
    const message =
      errorResponse?.message ??
      DEFAULT_ERROR_MESSAGES[response.status] ??
      "취향 분석 결과를 확정하지 못했습니다.";

    throw new ApiRequestError(message, response.status);
  }

  const { data } = (await response.json()) as ConfirmAiPreferenceAnalysisResponse;
  return data;
}
