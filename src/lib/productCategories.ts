// 상품 카테고리 공용 타입과 FE 전용 전체 카테고리 식별자

export interface ProductCategory {
  code: string;
  name: string;
}

export const ALL_PRODUCT_CATEGORY_CODE = "ALL";
