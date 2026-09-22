// 상품 추천 대상과 추천 맥락을 표현하는 타입

export interface RecommendationTarget {
  type: "SELF" | "FRIEND";
  userId: number;
  name: string;
  profileImageUrl: string | null;
  tasteKeywords: string[];
  interestKeywords: string[];
}
