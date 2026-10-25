// 캘린더 일정 요약 API 연동 전 UI 확인용 임시 데이터

import { formatDateKey } from "@/lib/formatDateKey";
import { mockDelay } from "@/mocks/config";
import type {
  CalendarDaySummary,
  CalendarEventColor,
  CalendarEventIndicator,
  CalendarSummary,
} from "@/types/calendar";

type MockCalendarEventSeed = {
  startDay: number;
  endDay: number;
  color: CalendarEventColor | null;
  createdOrder: number;
};

const mockEventSeeds: MockCalendarEventSeed[] = [
  { startDay: 4, endDay: 4, color: null, createdOrder: 1 },
  { startDay: 9, endDay: 9, color: null, createdOrder: 2 },
  { startDay: 18, endDay: 18, color: "GREEN", createdOrder: 3 },
  { startDay: 27, endDay: 27, color: "ROYAL_BLUE", createdOrder: 4 },
  { startDay: 27, endDay: 27, color: null, createdOrder: 5 },
  { startDay: 27, endDay: 27, color: "PINK", createdOrder: 6 },
  { startDay: 24, endDay: 28, color: "VIOLET", createdOrder: 7 },
  { startDay: 26, endDay: 30, color: "ORANGE", createdOrder: 8 },
  { startDay: 27, endDay: 27, color: "MINT", createdOrder: 9 },
  { startDay: 30, endDay: 33, color: "RED", createdOrder: 10 },
  { startDay: 31, endDay: 31, color: "GRAY", createdOrder: 0 },
];

type MockIndicator = CalendarEventIndicator & { createdOrder: number };

export async function getMockCalendarSummary(from: Date, to: Date): Promise<CalendarSummary> {
  await mockDelay();

  const fromKey = formatDateKey(from);
  const toKey = formatDateKey(to);
  const indicatorsByDate = new Map<string, MockIndicator[]>();
  const cursor = new Date(from.getFullYear(), from.getMonth() - 1, 1);

  while (cursor <= to) {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();

    mockEventSeeds.forEach(({ startDay, endDay, color, createdOrder }, seedIndex) => {
      if (new Date(year, monthIndex, startDay).getMonth() !== monthIndex) return;

      const eventId = `mock-${year}-${monthIndex + 1}-${seedIndex}`;

      for (let day = startDay; day <= endDay; day += 1) {
        const dateKey = formatDateKey(new Date(year, monthIndex, day));

        if (dateKey < fromKey || dateKey > toKey) continue;

        const indicators = indicatorsByDate.get(dateKey) ?? [];

        indicators.push({ eventId, color, createdOrder });
        indicatorsByDate.set(dateKey, indicators);
      }
    });

    cursor.setMonth(monthIndex + 1);
  }

  const items: CalendarDaySummary[] = [...indicatorsByDate.entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, indicators]) => ({
      date,
      eventCount: indicators.length,
      indicators: indicators
        .sort((left, right) => right.createdOrder - left.createdOrder)
        .map(({ eventId, color }) => ({ eventId, color })),
    }));

  return { timezone: "Asia/Seoul", items };
}
