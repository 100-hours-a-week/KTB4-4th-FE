// 상품 카테고리 목록 조회를 위한 서버 API 요청과 응답 타입
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { serverApiRequest } from "@/lib/api/serverClient";
import type { ProductCategory } from "@/lib/productCategories";

interface ProductCategoriesResponse {
  message: string;
  data: {
    items: ProductCategory[];
  };
}

export async function getProductCategories() {
  const { data } = await serverApiRequest<ProductCategoriesResponse>(
    API_ENDPOINTS.productCategories,
    {
      method: "GET",
      fallbackErrorMessage: "상품 카테고리를 불러오지 못했습니다.",
    },
  );

  // TODO: 현재 API가 전체 11개 카테고리를 반환해 상품이 없는 카테고리도 노출될 수 있음.
  // 백엔드에서 각 상품 목록에 실제 존재하는 카테고리만 반환하도록 개선되면 노출 항목을 조정한다.
  return data.items;
}
