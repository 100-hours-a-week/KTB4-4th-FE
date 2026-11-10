// 채팅방 메시지의 전송 시각과 날짜 구분선 문구를 만드는 유틸 함수 모음

import { parseServerDateTime } from "@/lib/parseServerDateTime";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_SHORT_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatChatMessageTime(dateTime: string) {
  const time = parseServerDateTime(dateTime);

  if (Number.isNaN(time)) return "";

  const date = new Date(time);
  const hours = date.getHours();
  const period = hours < 12 ? "오전" : "오후";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${period} ${displayHours}:${minutes}`;
}

export function getChatMessageDateKey(dateTime: string) {
  const time = parseServerDateTime(dateTime);

  if (Number.isNaN(time)) return "";

  const date = new Date(time);

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function formatChatDateDivider(dateTime: string, now = Date.now()) {
  const time = parseServerDateTime(dateTime);

  if (Number.isNaN(time)) return "";

  const date = new Date(time);
  const nowDate = new Date(now);
  const elapsedDays = Math.round((getStartOfDay(nowDate) - getStartOfDay(date)) / DAY_MS);

  if (elapsedDays <= 0) return "오늘";
  if (elapsedDays === 1) return "어제";

  const monthDay = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_SHORT_LABELS[date.getDay()]})`;

  return date.getFullYear() === nowDate.getFullYear()
    ? monthDay
    : `${date.getFullYear()}년 ${monthDay}`;
}
