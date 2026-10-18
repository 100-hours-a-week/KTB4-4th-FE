// 상품 추천 만족도 저장 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ProductDetailContext, ProductDetailFeedback } from "@/lib/api/productDetail";

export type ProductFeedbackContext = Exclude<ProductDetailContext, "FRIEND_GIFT">;

export interface SaveProductFeedbackRequest {
  context: ProductFeedbackContext;
  feedback: ProductDetailFeedback;
}

export interface SavedProductFeedback {
  productId: number;
  context: ProductFeedbackContext;
  feedback: ProductDetailFeedback;
}

interface SaveProductFeedbackResponse {
  message: string;
  data: SavedProductFeedback;
}

interface SaveProductFeedbackErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

function getRetryAfterSeconds(
  response: Response,
  errorResponse: SaveProductFeedbackErrorResponse | null,
) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(retryAfterSeconds) ? Math.max(0, Math.ceil(retryAfterSeconds)) : undefined;
}

export async function saveProductFeedback(productId: number, payload: SaveProductFeedbackRequest) {
  // TODO(#351): V3 '친구에게 슬쩍 물어보기' 도입 시 친구 문맥의 만족도 저장에도 재사용
  const response = await apiFetch(API_ENDPOINTS.productFeedback(productId), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as SaveProductFeedbackErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ?? "선물 만족도를 저장하지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as SaveProductFeedbackResponse;
  return data;
}
