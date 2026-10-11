// 온보딩 선택 항목의 API 코드와 화면 표시명 모음

export const INTEREST_CATEGORY_OPTIONS = [
  { code: "FASHION", label: "패션" },
  { code: "BEAUTY", label: "뷰티" },
  { code: "HOME_INTERIOR", label: "홈·인테리어" },
  { code: "COFFEE_TEA", label: "커피·차" },
  { code: "COOKING", label: "요리·베이킹" },
  { code: "GOURMET", label: "맛집 탐방" },
  { code: "TRAVEL", label: "여행" },
  { code: "FITNESS", label: "운동·헬스" },
  { code: "OUTDOOR", label: "캠핑·아웃도어" },
  { code: "GAME", label: "게임" },
  { code: "MUSIC", label: "음악" },
  { code: "MOVIE_DRAMA", label: "영화·드라마" },
  { code: "READING", label: "독서" },
  { code: "TECH", label: "IT·전자기기" },
  { code: "PET", label: "반려동물" },
] as const;

export const ALLERGY_OPTIONS = [
  { code: "PEANUT", label: "땅콩" },
  { code: "NUTS", label: "견과류" },
  { code: "MILK", label: "우유" },
  { code: "EGG", label: "달걀" },
  { code: "WHEAT", label: "밀" },
  { code: "SOY", label: "대두" },
  { code: "SHELLFISH", label: "갑각류" },
  { code: "FISH", label: "생선" },
] as const;

export const GIFT_EXCLUSION_OPTIONS = [
  { code: "PERFUME", label: "향수" },
  { code: "ALCOHOL", label: "주류" },
  { code: "CLOTHING", label: "의류" },
  { code: "FOOD", label: "식품" },
  { code: "COSMETICS", label: "화장품" },
  { code: "VOUCHER", label: "교환권" },
] as const;

export type InterestCategoryCode = (typeof INTEREST_CATEGORY_OPTIONS)[number]["code"];
export type AllergyCode = (typeof ALLERGY_OPTIONS)[number]["code"];
export type GiftExclusionCode = (typeof GIFT_EXCLUSION_OPTIONS)[number]["code"];
export type AvoidanceCode = AllergyCode | GiftExclusionCode;

const interestCategoryCodes = new Set<string>(INTEREST_CATEGORY_OPTIONS.map(({ code }) => code));
const allergyCodes = new Set<string>(ALLERGY_OPTIONS.map(({ code }) => code));
const giftExclusionCodes = new Set<string>(GIFT_EXCLUSION_OPTIONS.map(({ code }) => code));

export const isInterestCategoryCode = (value: string): value is InterestCategoryCode =>
  interestCategoryCodes.has(value);

export const isAllergyCode = (value: string): value is AllergyCode => allergyCodes.has(value);

export const isGiftExclusionCode = (value: string): value is GiftExclusionCode =>
  giftExclusionCodes.has(value);
