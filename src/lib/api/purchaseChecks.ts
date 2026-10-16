// 구매 여부 알림 모달에 보여줄 구매 확인 정보 조회 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ProductDetailContext } from "@/lib/api/productDetail";

// UNAVAILABLE이면 판매 중단 상품이라 구매 링크를 숨김
export type PurchaseCheckProductStatus = "ACTIVE" | "SOLD_OUT" | "UNAVAILABLE";

export interface PurchaseCheckFriend {
  userId: number;
  name: string;
}

export interface PurchaseCheckProduct {
  productId: number;
  name: string;
  productImageUrl: string | null;
  purchaseUrl: string | null;
  price: number | null;
  status: PurchaseCheckProductStatus;
}

export interface PurchaseCheck {
  purchaseCheckId: number;
  context: ProductDetailContext;
  // FRIEND_GIFT이면서 지금도 친구 관계가 유지되는 활성 친구일 때만 값이 있음
  friend: PurchaseCheckFriend | null;
  product: PurchaseCheckProduct;
  answered: boolean;
  // 답하기 전에는 null
  purchased: boolean | null;
  answeredAt: string | null;
  clickedAt: string;
}

interface PurchaseCheckResponse {
  message: string;
  data: PurchaseCheck;
}

interface PurchaseCheckErrorResponse {
  message?: string;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  404: "구매 확인 요청을 찾을 수 없습니다.",
  500: "요청을 처리하지 못했습니다.",
};

// 이미 답한 구매 확인도 200으로 조회되며 answered가 true로 내려옴
export async function getPurchaseCheck(purchaseCheckId: number) {
  const response = await apiFetch(API_ENDPOINTS.purchaseCheck(purchaseCheckId), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as PurchaseCheckErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        DEFAULT_ERROR_MESSAGES[response.status] ??
        "구매 확인 정보를 불러오지 못했습니다.",
      response.status,
    );
  }

  const { data } = (await response.json()) as PurchaseCheckResponse;

  return data;
}
