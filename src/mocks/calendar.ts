// 캘린더 API 연동 전 UI 확인용 이벤트 임시 데이터

import { formatDateKey } from "@/lib/formatDateKey";
import { mockDelay } from "@/mocks/config";
import type { CalendarEvent, CalendarEventType } from "@/types/calendar";

type MockCalendarEventSeed = {
  type: CalendarEventType;
  title: string;
  day: number;
};

// 날짜별 점 개수 확인을 위해 이벤트가 1개인 날과 여러 개인 날(27일)을 함께 구성
const mockEventSeeds: MockCalendarEventSeed[] = [
  { type: "BIRTHDAY", title: "민지 생일", day: 4 },
  { type: "BIRTHDAY", title: "준호 생일", day: 9 },
  { type: "SCHEDULE", title: "선물 구매", day: 18 },
  { type: "SCHEDULE", title: "팀 회식", day: 27 },
  { type: "BIRTHDAY", title: "서연 생일", day: 27 },
  { type: "SCHEDULE", title: "집들이 선물 준비", day: 27 },
  { type: "SCHEDULE", title: "정기 검진", day: 31 },
];

// 조회 기간에 걸친 달마다 같은 날짜로 이벤트를 만들고, 해당 달에 없는 날짜(예: 2월 31일)는 제외함
export async function getMockCalendarEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
  await mockDelay();

  const fromKey = formatDateKey(from);
  const toKey = formatDateKey(to);
  const events: CalendarEvent[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);

  while (cursor <= to) {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();

    mockEventSeeds.forEach(({ type, title, day }, index) => {
      const date = new Date(year, monthIndex, day);

      if (date.getMonth() !== monthIndex) return;

      const dateKey = formatDateKey(date);

      if (dateKey < fromKey || dateKey > toKey) return;

      events.push({ eventId: `mock-${dateKey}-${index}`, type, title, date: dateKey });
    });

    cursor.setMonth(monthIndex + 1);
  }

  return events;
}
