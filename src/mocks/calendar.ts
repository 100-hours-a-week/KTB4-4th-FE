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
  // 그 달의 마지막 날보다 크면 다음 달로 이어지는 일정
  endDay: number;
  color: CalendarEventColor | null;
  // 클수록 최근에 추가한 일정
  createdOrder: number;
};

// 하루 일정, 주를 넘는 일정(24~28일), 달을 넘는 일정(30일~다음 달 2일), 색 없는 생일,
// 점 5개를 넘는 날(27일)을 확인할 수 있도록 구성
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

// 조회 기간에 걸친 달마다 같은 날짜로 일정을 만들고, 여러 날 일정은 기간 안의 날짜마다 포함함
export async function getMockCalendarSummary(from: Date, to: Date): Promise<CalendarSummary> {
  await mockDelay();

  const fromKey = formatDateKey(from);
  const toKey = formatDateKey(to);
  const indicatorsByDate = new Map<string, MockIndicator[]>();
  // 이전 달에 시작해 조회 기간으로 이어지는 일정도 포함하도록 한 달 앞부터 확인
  const cursor = new Date(from.getFullYear(), from.getMonth() - 1, 1);

  while (cursor <= to) {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();

    mockEventSeeds.forEach(({ startDay, endDay, color, createdOrder }, seedIndex) => {
      // 해당 달에 없는 시작일(예: 2월 30일)의 일정은 제외
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
      // 서버처럼 최근에 추가한 일정이 앞에 오도록 정렬
      indicators: indicators
        .sort((left, right) => right.createdOrder - left.createdOrder)
        .map(({ eventId, color }) => ({ eventId, color })),
    }));

  return { timezone: "Asia/Seoul", items };
}
