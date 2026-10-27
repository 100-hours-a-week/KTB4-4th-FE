// 메인페이지 캘린더의 일정 요약·날짜별 일정 목록·일정 상세·일정 생성·수정 데이터 타입

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
  eventId: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  color: CalendarEventColor;
}

export interface CalendarDaySummary {
  date: string;
  eventCount: number;
  indicators: CalendarEventIndicator[];
}

export interface CalendarEventListItem {
  eventId: string;
  title: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  color: CalendarEventColor | null;
}

export interface CalendarEventDetail {
  eventId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  notificationEnabled: boolean;
  color: CalendarEventColor | null;
}

export interface CalendarEventCreateRequest {
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  description: string | null;
  color: CalendarEventColor;
  notificationEnabled: boolean;
}

export type CalendarEventUpdateRequest = CalendarEventCreateRequest;
