// 성능 측정용 계측 코드 사용 여부 설정

// 빌드할 때 값이 코드에 들어가므로 false로 빌드하면 계측 분기가 번들에서 제거됨
export const PERF_INSTRUMENT = process.env.NEXT_PUBLIC_PERF_INSTRUMENT === "true";
