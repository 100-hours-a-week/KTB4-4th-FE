// 상품 카테고리 API 연동 전 카테고리 배지에 사용하는 임시 데이터

export type ProductCategory = {
  id: string;
  name: string;
};

export const ALL_PRODUCT_CATEGORY_ID = "all";

// TODO: 상품 카테고리 API 연동 후 이 파일의 Mock 데이터 제거
export const mockProductCategories: readonly ProductCategory[] = [
  { id: ALL_PRODUCT_CATEGORY_ID, name: "전체" },
  { id: "voucher", name: "교환권" },
  { id: "beauty", name: "뷰티" },
  { id: "food", name: "식품" },
  { id: "health", name: "건강" },
  { id: "living", name: "리빙" },
  { id: "fashion", name: "패션" },
  { id: "digital", name: "디지털" },
  { id: "hobby", name: "취미" },
  { id: "pet", name: "반려동물" },
];
