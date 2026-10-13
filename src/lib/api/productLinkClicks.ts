// 외부 상품 링크 클릭 기록 API 요청 타입과 전송 함수
"use client";

import { getCsrfHeaders } from "@/lib/api/csrf";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ProductDetailContext } from "@/lib/api/productDetail";

interface ProductLinkClickBase {
  productId: number;
  recommendationId?: number;
}

export type RecordProductLinkClickRequest = ProductLinkClickBase &
  (
    | {
        context: Exclude<ProductDetailContext, "FRIEND_GIFT">;
        friendUserId?: never;
      }
    | {
        context: "FRIEND_GIFT";
        friendUserId: number;
      }
  );

export async function recordProductLinkClick(payload: RecordProductLinkClickRequest) {
  const csrfHeaders = await getCsrfHeaders();

  void fetch(API_ENDPOINTS.analytics.productLinkClicks, {
    method: "POST",
    keepalive: true,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...csrfHeaders,
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}
