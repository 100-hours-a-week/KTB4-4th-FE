// 메인페이지 캘린더에 표시하는 이벤트 데이터 타입

// BIRTHDAY는 카카오 캘린더에서 불러온 친구 생일, SCHEDULE은 사용자가 직접 추가한 일정
export type CalendarEventType = "BIRTHDAY" | "SCHEDULE";

// TODO: 카카오 캘린더 API와 일정 API 응답 스펙 확정 후 필드 보완
export interface CalendarEvent {
  eventId: string;
  type: CalendarEventType;
  title: string;
  // 이벤트가 있는 날짜이며 YYYY-MM-DD 형식
  date: string;
}
