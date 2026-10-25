// 로컬 날짜를 이벤트 조회·비교용 YYYY-MM-DD 문자열로 변환하는 함수

export function formatDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}
