// 성능 측정용 목업 데이터 사용 여부와 공통 응답 지연 설정

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const MOCK_RESPONSE_DELAY_MS = 150;

export function mockDelay() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_RESPONSE_DELAY_MS);
  });
}
