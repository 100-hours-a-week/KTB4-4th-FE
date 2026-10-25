// 캘린더 일정 색상명별 표시 이름과 색상 코드 모음 (카카오 톡캘린더 Enum: Color 기준)

import type { CalendarEventColor } from "@/types/calendar";

type CalendarEventColorInfo = {
  label: string;
  hex: string;
};

export const DEFAULT_CALENDAR_EVENT_COLOR: CalendarEventColor = "BLUE";

export const CALENDAR_EVENT_COLORS = {
  BLUE: { label: "파랑", hex: "#2C88DE" },
  ROYAL_BLUE: { label: "로열 블루", hex: "#2D69E0" },
  NAVY_BLUE: { label: "남색", hex: "#223788" },
  RED: { label: "빨강", hex: "#D42726" },
  PINK: { label: "분홍", hex: "#ED5683" },
  ORANGE: { label: "주황", hex: "#FF9429" },
  GREEN: { label: "초록", hex: "#149959" },
  LIME: { label: "라임", hex: "#7CB343" },
  OLIVE: { label: "올리브", hex: "#A4AD15" },
  MINT: { label: "민트", hex: "#5CC5BE" },
  MAGENTA: { label: "마젠타", hex: "#AB47BC" },
  VIOLET: { label: "보라", hex: "#8A4B9B" },
  LAVENDER: { label: "라벤더", hex: "#7986CB" },
  BROWN: { label: "갈색", hex: "#945C1F" },
  GRAY: { label: "회색", hex: "#666666" },
} as const satisfies Record<CalendarEventColor, CalendarEventColorInfo>;

export function getCalendarEventColorHex(color: CalendarEventColor | null) {
  return CALENDAR_EVENT_COLORS[color ?? DEFAULT_CALENDAR_EVENT_COLOR].hex;
}
