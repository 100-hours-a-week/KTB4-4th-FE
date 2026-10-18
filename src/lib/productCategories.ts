// 상품 카테고리 공용 타입, FE 전용 전체 카테고리 식별자, 카테고리 코드별 표시명 매핑

export interface ProductCategory {
  code: string;
  name: string;
}

export const ALL_PRODUCT_CATEGORY_CODE = "ALL";

// 상품 응답의 category 코드를 화면 표시명으로 바꾸기 위한 매핑으로, 백엔드 카테고리 목록 API 기준
const PRODUCT_CATEGORY_NAMES: Record<string, string> = {
  VOUCHER: "교환권",
  LIVING: "리빙",
  BEAUTY: "뷰티",
  FASHION: "패션",
  FOOD: "식품",
  DIGITAL: "가전·디지털",
  HEALTH: "건강",
  LUXURY: "명품",
  BOOKS_TICKETS: "책·음반티켓",
  SPORTS: "레저·스포츠",
  PET: "반려동물",
};

// 매핑에 없는 코드는 원래 코드를 그대로 반환함
export const getProductCategoryName = (categoryCode: string) =>
  PRODUCT_CATEGORY_NAMES[categoryCode] ?? categoryCode;
