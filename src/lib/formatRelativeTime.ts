// 알림 생성 시각을 현재 시각 기준 상대 시간 문구로 변환하는 유틸 함수

import { parseServerDateTime } from "@/lib/parseServerDateTime";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(dateTime: string, now = Date.now()) {
  const time = parseServerDateTime(dateTime);

  if (Number.isNaN(time)) return "";

  const elapsedMs = Math.max(0, now - time);

  if (elapsedMs < MINUTE_MS) return "방금 전";
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)}분 전`;
  if (elapsedMs < DAY_MS) return `${Math.floor(elapsedMs / HOUR_MS)}시간 전`;
  if (elapsedMs < 2 * DAY_MS) return "어제";

  const date = new Date(time);

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
