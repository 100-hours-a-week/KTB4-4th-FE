// 성능 측정용 내 추천·친구 선물 추천 상품 임시 데이터

import type {
  GiftRecommendation,
  GiftRecommendationsPage,
  MyGiftRecommendation,
} from "@/lib/api/giftRecommendations";
import type { PersonalRecommendationsPage } from "@/lib/api/personalRecommendations";
import { MOCK_PRODUCT_IMAGE_FORMAT, mockDelay } from "@/mocks/config";

const MOCK_PRODUCT_COUNT = 1000;
const MOCK_PRODUCT_ID_START = 900_001;
// public/images/mock에 준비된 상품 이미지 수
const MOCK_PRODUCT_IMAGE_COUNT = 45;
// 백엔드 카테고리 목록 API의 카테고리 코드
const MOCK_CATEGORY_CODES = [
  "VOUCHER",
  "LIVING",
  "BEAUTY",
  "FASHION",
  "FOOD",
  "DIGITAL",
  "HEALTH",
  "LUXURY",
  "BOOKS_TICKETS",
  "SPORTS",
  "PET",
];
const MOCK_PRICE_UNIT = 10_000;
const MOCK_MIN_PRICE = 10_000;
const MOCK_MAX_PRICE = 200_000;
// 측정마다 같은 목업 데이터를 만들기 위한 고정 시드
const MOCK_RANDOM_SEED = 587;

// 같은 시드로 항상 같은 순서의 0 이상 1 미만 난수를 만드는 mulberry32 방식 의사난수 생성기
function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

type MockPageParams = {
  category?: string;
  cursor?: string;
  size: number;
  minPrice?: number;
  maxPrice?: number;
};

const random = createSeededRandom(MOCK_RANDOM_SEED);

// 카테고리별 상품 수는 고르게 맞추고 목록 안의 순서만 섞음
const mockCategoryCodes = Array.from(
  { length: MOCK_PRODUCT_COUNT },
  (_, index) => MOCK_CATEGORY_CODES[index % MOCK_CATEGORY_CODES.length],
);

for (let index = mockCategoryCodes.length - 1; index > 0; index -= 1) {
  const swapIndex = Math.floor(random() * (index + 1));
  [mockCategoryCodes[index], mockCategoryCodes[swapIndex]] = [
    mockCategoryCodes[swapIndex],
    mockCategoryCodes[index],
  ];
}

const mockPriceStepCount = (MOCK_MAX_PRICE - MOCK_MIN_PRICE) / MOCK_PRICE_UNIT + 1;

const mockProducts: GiftRecommendation[] = mockCategoryCodes.map((category, index) => {
  const productId = MOCK_PRODUCT_ID_START + index;
  const order = String(index + 1).padStart(4, "0");
  const imageOrder = String((index % MOCK_PRODUCT_IMAGE_COUNT) + 1).padStart(2, "0");

  return {
    recommendationId: productId,
    productId,
    // 같은 이미지를 여러 상품이 써도 브라우저 캐시에 묶이지 않도록 상품마다 주소를 다르게 지정함
    productImageUrl: `/images/mock/product-${imageOrder}.${MOCK_PRODUCT_IMAGE_FORMAT}?id=${productId}`,
    purchaseUrl: "https://example.com/",
    category,
    name:
      random() < 0.5
        ? `테스트 상품 ${order}`
        : `테스트 상품 ${order} 두 줄까지 표시되는 긴 상품명을 확인하기 위한 이름`,
    price: MOCK_MIN_PRICE + Math.floor(random() * mockPriceStepCount) * MOCK_PRICE_UNIT,
    score: 0.9,
    matchingKeywords: ["테스트"],
    reason: "성능 측정용 목업 추천 이유입니다.",
  };
});

// 백엔드와 같이 카테고리·예산 필터와 관계없이 전체 상품 기준 가격 범위를 반환함
const mockPriceRange = {
  minPrice: Math.min(...mockProducts.map((product) => product.price)),
  maxPrice: Math.max(...mockProducts.map((product) => product.price)),
};

function getMockProductsPage({ category, cursor, size, minPrice, maxPrice }: MockPageParams) {
  const hasPriceFilter = minPrice !== undefined && maxPrice !== undefined;
  const filteredProducts = mockProducts.filter(
    (product) =>
      (category === undefined || product.category === category) &&
      (!hasPriceFilter || (product.price >= minPrice && product.price <= maxPrice)),
  );
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

  const page = getMockProductsPage(params);

  return {
    ...page,
    items: page.items.map((product) => ({
      ...product,
      score: 0.9,
      myFeedback: null,
    })),
  } satisfies PersonalRecommendationsPage;
}

export async function getMockGiftRecommendationsPage(params: MockPageParams) {
  await mockDelay();

  return getMockProductsPage(params) satisfies GiftRecommendationsPage;
}

export async function getMockMyGiftRecommendationsPage(params: MockPageParams) {
  await mockDelay();

  const page = getMockProductsPage(params);

  return {
    ...page,
    items: page.items.map((product) => ({
      ...product,
      myFeedback: null,
    })),
  } satisfies GiftRecommendationsPage<MyGiftRecommendation>;
}
