// 메인 페이지 안내 문구 조회 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface Guidance {
  title: string;
  description: string;
}

export interface GuidanceData {
  tasteAnalysisCompleted: boolean;
  guidance: Guidance;
}

interface GuidanceResponse {
  message: string;
  data: GuidanceData;
}

let guidanceRequest: Promise<GuidanceData> | null = null;

async function requestGuidance() {
  const response = await apiFetch(API_ENDPOINTS.guidance, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("메인 안내 정보를 불러오지 못했습니다.", response.status);
  }

  const { data } = (await response.json()) as GuidanceResponse;
  return data;
}

export function getGuidance() {
  if (!guidanceRequest) {
    guidanceRequest = requestGuidance().finally(() => {
      guidanceRequest = null;
    });
  }

  return guidanceRequest;
}
