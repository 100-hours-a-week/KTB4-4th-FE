// 메인페이지 캘린더의 일정 요약·날짜별 일정 목록·일정 상세·일정 생성 데이터 타입

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

// TODO: 일정 상세 조회 API 응답 스펙이 바뀔 수 있으므로 확정 후 필드 재확인
export interface CalendarEventDetail {
  eventId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  color: CalendarEventColor | null;
}

// TODO: 일정 생성 API 요청·응답 스펙 확정 후 하루 종일 일정의 startAt·endAt 형식과 응답 필드 재확인
export interface CalendarEventCreateRequest {
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  description: string | null;
  color: CalendarEventColor;
}

export interface CalendarEventCreateResult {
  eventId: string;
}
