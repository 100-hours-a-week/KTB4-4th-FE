// 시간대 표기 없이 UTC로 내려오는 서버 일시 문자열을 타임스탬프로 변환하는 유틸 함수

const TIME_ZONE_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;
const FRACTION_PATTERN = /(\.\d{3})\d+/;

export function parseServerDateTime(dateTime: string) {
  // 브라우저별 파싱 차이를 피하려고 소수점 이하 초를 밀리초 단위로 맞춤
  const normalized = dateTime.replace(FRACTION_PATTERN, "$1");

  return Date.parse(TIME_ZONE_PATTERN.test(normalized) ? normalized : `${normalized}Z`);
}
