// 상품 카테고리 API 연동 전 카테고리 배지에 사용하는 임시 데이터

export type ProductCategory = {
  id: string;
  name: string;
};

export const ALL_PRODUCT_CATEGORY_ID = "all";

// TODO: 서버 상품 카테고리 목록 확정 및 API 연동 후 이 파일의 Mock 데이터 제거
export const mockProductCategories: readonly ProductCategory[] = [
  { id: ALL_PRODUCT_CATEGORY_ID, name: "전체" },
  { id: "voucher", name: "교환권" },
  { id: "living", name: "리빙" },
  { id: "beauty", name: "뷰티" },
  { id: "fashion", name: "패션" },
  { id: "food", name: "식품" },
  { id: "digital", name: "가전·디지털" },
  { id: "health", name: "건강" },
  { id: "luxury", name: "명품" },
  { id: "books_tickets", name: "책·음반티켓" },
  { id: "sports", name: "레저·스포츠" },
  { id: "pet", name: "반려동물" },
];
