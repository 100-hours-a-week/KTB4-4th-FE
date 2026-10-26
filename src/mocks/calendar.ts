// 캘린더 일정 요약·날짜별 일정 목록·일정 상세·일정 생성 API 연동 전 UI 확인용 임시 데이터

import { formatDateKey } from "@/lib/formatDateKey";
import { mockDelay } from "@/mocks/config";
import type {
  CalendarDaySummary,
  CalendarEventColor,
  CalendarEventCreateRequest,
  CalendarEventCreateResult,
  CalendarEventDetail,
  CalendarEventList,
  CalendarEventListItem,
  CalendarSummary,
} from "@/types/calendar";

type MockCalendarEventSeed = {
  title: string;
  description: string | null;
  startDay: number;
  endDay: number;
  color: CalendarEventColor | null;
  createdOrder: number;
};

const mockEventSeeds: MockCalendarEventSeed[] = [
  { title: "민지 생일", description: null, startDay: 4, endDay: 4, color: null, createdOrder: 1 },
  { title: "준호 생일", description: null, startDay: 9, endDay: 9, color: null, createdOrder: 2 },
  {
    title: "선물 구매",
    description: "민지 생일 선물 미리 주문",
    startDay: 18,
    endDay: 18,
    color: "GREEN",
    createdOrder: 3,
  },
  {
    title: "팀 회식",
    description: "강남역 2번 출구 앞 고깃집",
    startDay: 27,
    endDay: 27,
    color: "ROYAL_BLUE",
    createdOrder: 4,
  },
  { title: "서연 생일", description: null, startDay: 27, endDay: 27, color: null, createdOrder: 5 },
  {
    title: "집들이 선물 준비",
    description: "디퓨저나 핸드워시 세트 알아보기",
    startDay: 27,
    endDay: 27,
    color: "PINK",
    createdOrder: 6,
  },
  {
    title: "출장",
    description: "부산 지사 방문, 숙소는 해운대 근처",
    startDay: 24,
    endDay: 28,
    color: "VIOLET",
    createdOrder: 7,
  },
  {
    title: "제주 여행",
    description: "렌터카 예약 완료, 첫날 저녁은 흑돼지",
    startDay: 26,
    endDay: 30,
    color: "ORANGE",
    createdOrder: 8,
  },
  {
    title: "병원 예약",
    description: null,
    startDay: 27,
    endDay: 27,
    color: "MINT",
    createdOrder: 9,
  },
  {
    title: "가족 여행",
    description: "부모님 모시고 강릉, 숙소 체크인 오후 3시",
    startDay: 30,
    endDay: 33,
    color: "RED",
    createdOrder: 10,
  },
  {
    title: "정기 검진",
    description: "검진 전날 저녁 9시 이후 금식",
    startDay: 31,
    endDay: 31,
    color: "GRAY",
    createdOrder: 0,
  },
  {
    title: "엄마 생신 케이크 예약",
    description: "동네 빵집에 생크림 케이크 2호 예약",
    startDay: 27,
    endDay: 27,
    color: "RED",
    createdOrder: 11,
  },
  {
    title: "동아리 모임",
    description: null,
    startDay: 27,
    endDay: 27,
    color: "LIME",
    createdOrder: 12,
  },
  {
    title: "택배 수령",
    description: "경비실 보관",
    startDay: 27,
    endDay: 27,
    color: "BROWN",
    createdOrder: 13,
  },
  {
    title: "헬스장 PT",
    description: null,
    startDay: 27,
    endDay: 27,
    color: "NAVY_BLUE",
    createdOrder: 14,
  },
  {
    title: "결혼기념일 선물 고르기 및 레스토랑 예약 확인",
    description:
      "레스토랑은 창가 자리로 요청하고, 선물은 지난번에 이야기했던 손목시계 후보 세 가지 중에서 고르기",
    startDay: 27,
    endDay: 27,
    color: "MAGENTA",
    createdOrder: 15,
  },
  {
    title: "스터디 발표 준비",
    description: "발표 자료 10장 이내",
    startDay: 27,
    endDay: 27,
    color: "OLIVE",
    createdOrder: 16,
  },
  {
    title: "친구 집들이",
    description: "저녁 7시, 휴지 사 가기",
    startDay: 27,
    endDay: 27,
    color: "LAVENDER",
    createdOrder: 17,
  },
];

type MockCalendarEvent = CalendarEventListItem & { createdOrder: number };

type MockCreatedCalendarEvent = Omit<CalendarEventDetail, "eventId"> & {
  eventId: string;
  createdOrder: number;
};

const CREATED_EVENT_ID_PREFIX = "created-";
const mockCreatedEvents: MockCreatedCalendarEvent[] = [];

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

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

  mockCreatedEvents.forEach(({ eventId, title, color, startDate, endDate, createdOrder }) => {
    const day = parseDateKey(startDate);

    while (formatDateKey(day) <= endDate) {
      const dateKey = formatDateKey(day);

      if (dateKey >= fromKey && dateKey <= toKey) {
        const events = eventsByDate.get(dateKey) ?? [];

        events.push({ eventId, title, color, createdOrder });
        eventsByDate.set(dateKey, events);
      }

      day.setDate(day.getDate() + 1);
    }
  });

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

export async function getMockCalendarEventDetail(eventId: string): Promise<CalendarEventDetail> {
  await mockDelay();

  if (eventId.startsWith(CREATED_EVENT_ID_PREFIX)) {
    const createdEvent = mockCreatedEvents.find((event) => event.eventId === eventId);

    if (!createdEvent) throw new Error("일정을 찾을 수 없습니다.");

    const { createdOrder: _createdOrder, ...detail } = createdEvent;

    return detail;
  }

  const [, year, month, seedIndex] = eventId.split("-").map(Number);
  const seed = mockEventSeeds[seedIndex];

  if (!seed || Number.isNaN(year) || Number.isNaN(month)) {
    throw new Error("일정을 찾을 수 없습니다.");
  }

  return {
    eventId,
    title: seed.title,
    description: seed.description,
    startDate: formatDateKey(new Date(year, month - 1, seed.startDay)),
    endDate: formatDateKey(new Date(year, month - 1, seed.endDay)),
    color: seed.color,
  };
}

export async function createMockCalendarEvent(
  request: CalendarEventCreateRequest,
): Promise<CalendarEventCreateResult> {
  await mockDelay();

  const createdOrder = 1000 + mockCreatedEvents.length;
  const eventId = `${CREATED_EVENT_ID_PREFIX}${createdOrder}`;

  mockCreatedEvents.push({
    eventId,
    title: request.title,
    description: request.description,
    startDate: request.startAt.slice(0, 10),
    endDate: request.endAt.slice(0, 10),
    color: request.color,
    createdOrder,
  });

  return { eventId };
}
