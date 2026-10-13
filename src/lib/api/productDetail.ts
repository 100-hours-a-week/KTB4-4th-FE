// 상품 상세 조회를 위한 서버 API 요청과 응답 타입
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { serverApiRequest } from "@/lib/api/serverClient";

export type ProductDetailContext = "PERSONAL" | "MY_GIFT" | "FRIEND_GIFT";

export type ProductDetailFeedback = "LIKE" | "DISLIKE";

export interface ProductDetail {
  productId: number;
  name: string;
  category: string;
  description: string;
  price: number;
  productImageUrl: string | null;
  purchaseUrl: string;
  recommendation: {
    recommendationId: number;
    reason: string;
    matchingKeywords: string[];
  };
  myFeedback: ProductDetailFeedback | null;
}

type GetProductDetailParams =
  | {
      productId: number;
      context: Exclude<ProductDetailContext, "FRIEND_GIFT">;
      userId?: never;
    }
  | {
      productId: number;
      context: "FRIEND_GIFT";
      userId: number;
    };

interface ProductDetailResponse {
  message: string;
  data: ProductDetail;
}

export async function getProductDetail({ productId, context, userId }: GetProductDetailParams) {
  const searchParams = new URLSearchParams({ context });

  if (context === "FRIEND_GIFT") {
    searchParams.set("userId", String(userId));
  }

  const { data } = await serverApiRequest<ProductDetailResponse>(
    `${API_ENDPOINTS.productDetail(productId)}?${searchParams.toString()}`,
    {
      method: "GET",
      fallbackErrorMessage: "상품 상세 정보를 불러오지 못했습니다.",
    },
  );

  return data;
}
