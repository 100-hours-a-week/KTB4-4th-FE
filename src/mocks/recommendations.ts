// 성능 측정용 내 추천·친구 선물 추천 상품 임시 데이터

import type { GiftRecommendation, GiftRecommendationsPage } from "@/lib/api/giftRecommendations";
import type { PersonalRecommendationsPage } from "@/lib/api/personalRecommendations";
import { mockDelay } from "@/mocks/config";

const MOCK_PRODUCT_COUNT = 45;
const MOCK_PRODUCT_ID_START = 900_001;
const MOCK_CATEGORIES = ["패션", "뷰티", "리빙", "디지털", "식품"];

type MockPageParams = {
  cursor?: string;
  size: number;
  minPrice?: number;
  maxPrice?: number;
};

const mockProducts: GiftRecommendation[] = Array.from(
  { length: MOCK_PRODUCT_COUNT },
  (_, index) => {
    const order = String(index + 1).padStart(2, "0");

    return {
      recommendationId: MOCK_PRODUCT_ID_START + index,
      productId: MOCK_PRODUCT_ID_START + index,
      productImageUrl: `/images/mock/product-${order}.jpg`,
      purchaseUrl: "https://example.com/",
      category: MOCK_CATEGORIES[index % MOCK_CATEGORIES.length],
      name:
        index % 2 === 0
          ? `테스트 상품 ${order}`
          : `테스트 상품 ${order} 두 줄까지 표시되는 긴 상품명을 확인하기 위한 이름`,
      price: 10_000 + ((index * 7) % 20) * 10_000,
      matchingKeywords: ["테스트"],
      reason: "성능 측정용 목업 추천 이유입니다.",
    };
  },
);

const mockPriceRange = {
  minPrice: Math.min(...mockProducts.map((product) => product.price)),
  maxPrice: Math.max(...mockProducts.map((product) => product.price)),
};

function getMockProductsPage({ cursor, size, minPrice, maxPrice }: MockPageParams) {
  const filteredProducts =
    minPrice !== undefined && maxPrice !== undefined
      ? mockProducts.filter((product) => product.price >= minPrice && product.price <= maxPrice)
      : mockProducts;
  const start = cursor ? Number(cursor) : 0;
  const end = start + size;
  const hasNext = end < filteredProducts.length;

  return {
    items: filteredProducts.slice(start, end),
    priceRange: mockPriceRange,
    nextCursor: hasNext ? String(end) : null,
    hasNext,
  };
}

export async function getMockPersonalRecommendationsPage(params: MockPageParams) {
  await mockDelay();

  return getMockProductsPage(params) satisfies PersonalRecommendationsPage;
}

export async function getMockGiftRecommendationsPage(params: MockPageParams) {
  await mockDelay();

  return getMockProductsPage(params) satisfies GiftRecommendationsPage;
}
