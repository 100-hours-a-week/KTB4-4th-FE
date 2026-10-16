// 구매 여부 알림 모달의 구매 확인 정보 조회와 구매 여부 답변 전송 API 요청 및 응답 타입
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

export interface PurchaseCheckAnswer {
  purchaseCheckId: number;
  purchased: boolean;
  answeredAt: string;
}

interface PurchaseCheckAnswerResponse {
  message: string;
  data: PurchaseCheckAnswer;
}

interface PurchaseCheckErrorResponse {
  message?: string;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  404: "구매 확인 요청을 찾을 수 없습니다.",
  409: "이미 구매 여부를 답했습니다.",
  500: "요청을 처리하지 못했습니다.",
};

async function toPurchaseCheckError(response: Response, fallbackMessage: string) {
  const errorResponse = (await response
    .json()
    .catch(() => null)) as PurchaseCheckErrorResponse | null;

  return new ApiRequestError(
    errorResponse?.message ?? DEFAULT_ERROR_MESSAGES[response.status] ?? fallbackMessage,
    response.status,
  );
}

// 이미 답한 구매 확인도 200으로 조회되며 answered가 true로 내려옴
export async function getPurchaseCheck(purchaseCheckId: number) {
  const response = await apiFetch(API_ENDPOINTS.purchaseCheck(purchaseCheckId), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toPurchaseCheckError(response, "구매 확인 정보를 불러오지 못했습니다.");
  }

  const { data } = (await response.json()) as PurchaseCheckResponse;

  return data;
}

// 이미 답한 구매 확인이면 409를 반환하므로 호출하는 쪽에서 답변 완료 상태로 처리함
export async function answerPurchaseCheck(purchaseCheckId: number, purchased: boolean) {
  const response = await apiFetch(API_ENDPOINTS.purchaseCheck(purchaseCheckId), {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ purchased }),
  });

  if (!response.ok) {
    throw await toPurchaseCheckError(response, "구매 여부를 저장하지 못했습니다.");
  }

  const { data } = (await response.json()) as PurchaseCheckAnswerResponse;

  return data;
}
