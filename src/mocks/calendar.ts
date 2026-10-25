// 캘린더 일정 요약·날짜별 일정 목록 API 연동 전 UI 확인용 임시 데이터

import { formatDateKey } from "@/lib/formatDateKey";
import { mockDelay } from "@/mocks/config";
import type {
  CalendarDaySummary,
  CalendarEventColor,
  CalendarEventList,
  CalendarEventListItem,
  CalendarSummary,
} from "@/types/calendar";

type MockCalendarEventSeed = {
  title: string;
  startDay: number;
  endDay: number;
  color: CalendarEventColor | null;
  createdOrder: number;
};

const mockEventSeeds: MockCalendarEventSeed[] = [
  { title: "민지 생일", startDay: 4, endDay: 4, color: null, createdOrder: 1 },
  { title: "준호 생일", startDay: 9, endDay: 9, color: null, createdOrder: 2 },
  { title: "선물 구매", startDay: 18, endDay: 18, color: "GREEN", createdOrder: 3 },
  { title: "팀 회식", startDay: 27, endDay: 27, color: "ROYAL_BLUE", createdOrder: 4 },
  { title: "서연 생일", startDay: 27, endDay: 27, color: null, createdOrder: 5 },
  { title: "집들이 선물 준비", startDay: 27, endDay: 27, color: "PINK", createdOrder: 6 },
  { title: "출장", startDay: 24, endDay: 28, color: "VIOLET", createdOrder: 7 },
  { title: "제주 여행", startDay: 26, endDay: 30, color: "ORANGE", createdOrder: 8 },
  { title: "병원 예약", startDay: 27, endDay: 27, color: "MINT", createdOrder: 9 },
  { title: "가족 여행", startDay: 30, endDay: 33, color: "RED", createdOrder: 10 },
  { title: "정기 검진", startDay: 31, endDay: 31, color: "GRAY", createdOrder: 0 },
  { title: "엄마 생신 케이크 예약", startDay: 27, endDay: 27, color: "RED", createdOrder: 11 },
  { title: "동아리 모임", startDay: 27, endDay: 27, color: "LIME", createdOrder: 12 },
  { title: "택배 수령", startDay: 27, endDay: 27, color: "BROWN", createdOrder: 13 },
  { title: "헬스장 PT", startDay: 27, endDay: 27, color: "NAVY_BLUE", createdOrder: 14 },
  {
    title: "결혼기념일 선물 고르기 및 레스토랑 예약 확인",
    startDay: 27,
    endDay: 27,
    color: "MAGENTA",
    createdOrder: 15,
  },
  { title: "스터디 발표 준비", startDay: 27, endDay: 27, color: "OLIVE", createdOrder: 16 },
  { title: "친구 집들이", startDay: 27, endDay: 27, color: "LAVENDER", createdOrder: 17 },
];

type MockCalendarEvent = CalendarEventListItem & { createdOrder: number };

function collectMockEventsByDate(from: Date, to: Date) {
  const fromKey = formatDateKey(from);
  const toKey = formatDateKey(to);
  const eventsByDate = new Map<string, MockCalendarEvent[]>();
  const cursor = new Date(from.getFullYear(), from.getMonth() - 1, 1);

  while (cursor <= to) {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();

    mockEventSeeds.forEach(({ title, startDay, endDay, color, createdOrder }, seedIndex) => {
      if (new Date(year, monthIndex, startDay).getMonth() !== monthIndex) return;

      const eventId = `mock-${year}-${monthIndex + 1}-${seedIndex}`;

      for (let day = startDay; day <= endDay; day += 1) {
        const dateKey = formatDateKey(new Date(year, monthIndex, day));

        if (dateKey < fromKey || dateKey > toKey) continue;

        const events = eventsByDate.get(dateKey) ?? [];

        events.push({ eventId, title, color, createdOrder });
        eventsByDate.set(dateKey, events);
      }
    });

    cursor.setMonth(monthIndex + 1);
  }

  eventsByDate.forEach((events) =>
    events.sort((left, right) => right.createdOrder - left.createdOrder),
  );

  return eventsByDate;
}

export async function getMockCalendarSummary(from: Date, to: Date): Promise<CalendarSummary> {
  await mockDelay();

  const items: CalendarDaySummary[] = [...collectMockEventsByDate(from, to).entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, events]) => ({
      date,
      eventCount: events.length,
      indicators: events.map(({ eventId, color }) => ({ eventId, color })),
    }));

  return { timezone: "Asia/Seoul", items };
}

export async function getMockCalendarEventList(date: Date): Promise<CalendarEventList> {
  await mockDelay();

  const events = collectMockEventsByDate(date, date).get(formatDateKey(date)) ?? [];

  return { items: events.map(({ eventId, title, color }) => ({ eventId, title, color })) };
}
