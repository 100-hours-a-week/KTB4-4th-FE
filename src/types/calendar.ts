// 메인페이지 캘린더에 표시하는 일정 요약 데이터 타입

// 카카오 톡캘린더 Enum: Color의 색상명
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

// 날짜 아래 점 하나에 해당하는 일정 표시 정보
export interface CalendarEventIndicator {
  eventId: string;
  // 일정 생성 시 색을 지정하지 않았으면 비어 있을 수 있으며, 화면에서는 BLUE로 표시
  color: CalendarEventColor | null;
}

// 하루 단위 일정 요약이며, 여러 날에 걸친 일정은 기간 안의 날짜마다 포함됨
export interface CalendarDaySummary {
  // YYYY-MM-DD 형식
  date: string;
  eventCount: number;
  // TODO: 최근 추가한 일정이 앞에 오도록 서버에서 정렬해 내려주는지 백엔드와 확인
  indicators: CalendarEventIndicator[];
}

export interface CalendarSummary {
  timezone: string;
  items: CalendarDaySummary[];
}
