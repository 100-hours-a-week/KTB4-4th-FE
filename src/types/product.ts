// 추천 상품 카드에 필요한 상품 정보 타입

export interface RecommendedProduct {
  id: number;
  name: string;
  price: number;
  recommendationReason: string;
  imageUrl: string | null;
}
