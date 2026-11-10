// 대화 목록의 마지막 메시지 전송 시각을 현재 시각 기준 표기 문구로 변환하는 유틸 함수

import { parseServerDateTime } from "@/lib/parseServerDateTime";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const WEEK_DAYS = 7;
const WEEKDAY_LABELS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

// 오늘 보낸 메시지는 24시간제 시각으로 표기함
function formatClockTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function formatChatTime(dateTime: string, now = Date.now()) {
  const time = parseServerDateTime(dateTime);

  if (Number.isNaN(time)) return "";

  const elapsedMs = Math.max(0, now - time);

  if (elapsedMs < MINUTE_MS) return "방금";
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)}분 전`;

  const date = new Date(time);
  const nowDate = new Date(now);
  // 경과 시간이 아닌 달력 날짜 기준으로 오늘·어제·요일 구분
  const elapsedDays = Math.round((getStartOfDay(nowDate) - getStartOfDay(date)) / (24 * HOUR_MS));

  if (elapsedDays <= 0) return formatClockTime(date);
  if (elapsedDays === 1) return "어제";
  if (elapsedDays < WEEK_DAYS) return WEEKDAY_LABELS[date.getDay()];

  const monthDay = `${date.getMonth() + 1}월 ${date.getDate()}일`;

  return date.getFullYear() === nowDate.getFullYear()
    ? monthDay
    : `${date.getFullYear()}년 ${monthDay}`;
}
