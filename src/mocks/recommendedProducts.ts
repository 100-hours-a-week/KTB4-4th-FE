// 상품 추천 API 연동 전 추천 상품 목록을 제공하는 임시 데이터

import type { RecommendedProduct } from "@/types/product";

// TODO: 상품 추천 API 연동 완료 후 이 파일의 Mock 데이터 제거
export const temporaryRecommendedProducts: RecommendedProduct[] = [
  {
    id: 1,
    name: "우드 무드등",
    price: 34_900,
    recommendationReason: "침대 옆 인테리어 얘기를 자주 했고 예산에도 맞아요.",
    imageUrl: null,
  },
  {
    id: 2,
    name: "미니 디퓨저 세트",
    price: 28_500,
    recommendationReason: "강한 향보다 은은한 향을 선호하는 기록과 맞아요.",
    imageUrl: null,
  },
  {
    id: 3,
    name: "데스크 오거나이저",
    price: 22_900,
    recommendationReason: "최근 책상 정리와 실용적인 소품에 관심이 있어요.",
    imageUrl: null,
  },
];
