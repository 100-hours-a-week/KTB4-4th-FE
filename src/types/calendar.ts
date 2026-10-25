// 메인페이지 캘린더에 표시하는 일정 요약·날짜별 일정 목록 데이터 타입

export type CalendarEventColor =
  | "BLUE"
  | "ROYAL_BLUE"
  | "NAVY_BLUE"
  | "RED"
  | "PINK"
  | "ORANGE"
  | "GREEN"
  | "LIME"
  | "OLIVE"
  | "MINT"
  | "MAGENTA"
  | "VIOLET"
  | "LAVENDER"
  | "BROWN"
  | "GRAY";

export interface CalendarEventIndicator {
  eventId: string;
  color: CalendarEventColor | null;
}

export interface CalendarDaySummary {
  date: string;
  eventCount: number;
  // TODO: 최근 추가한 일정이 앞에 오도록 서버에서 정렬해 내려주는지 백엔드와 확인
  indicators: CalendarEventIndicator[];
}

export interface CalendarSummary {
  timezone: string;
  items: CalendarDaySummary[];
}

export interface CalendarEventListItem {
  eventId: string;
  title: string;
  color: CalendarEventColor | null;
}

export interface CalendarEventList {
  items: CalendarEventListItem[];
}
