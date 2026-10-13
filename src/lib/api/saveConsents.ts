// 개인정보 활용 동의 결과 저장 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface SaveConsentItem {
  id: number;
  agreed: boolean;
}

export interface SaveConsentsRequest {
  consents: SaveConsentItem[];
}

interface SaveConsentsErrorResponse {
  message?: string;
}

export async function saveConsents(payload: SaveConsentsRequest) {
  const response = await apiFetch(API_ENDPOINTS.users.consents, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as SaveConsentsErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ?? "개인정보 활용 동의를 저장하지 못했습니다.",
      response.status,
    );
  }
}
