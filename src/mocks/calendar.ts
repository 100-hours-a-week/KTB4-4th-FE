// 캘린더 UI에서 사용자가 등록한 일정의 메모리 기반 임시 CRUD 모듈

import { formatDateKey } from "@/lib/formatDateKey";
import { mockDelay } from "@/mocks/config";
import type {
  CalendarDaySummary,
  CalendarEventCreateRequest,
  CalendarEventCreateResult,
  CalendarEventDetail,
  CalendarEventList,
  CalendarEventListItem,
  CalendarEventUpdateRequest,
  CalendarSummary,
} from "@/types/calendar";

type MockCalendarEvent = CalendarEventListItem & { createdOrder: number };

type MockSavedCalendarEvent = CalendarEventDetail & { createdOrder: number };

const CREATED_EVENT_ID_PREFIX = "created-";
const mockSavedEvents = new Map<string, MockSavedCalendarEvent>();
let mockCreatedCount = 0;

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toSavedEvent(
  eventId: string,
  request: CalendarEventCreateRequest,
  createdOrder: number,
): MockSavedCalendarEvent {
  return {
    eventId,
    title: request.title,
    description: request.description,
    startDate: request.startAt.slice(0, 10),
    endDate: request.endAt.slice(0, 10),
    startAt: request.startAt,
    endAt: request.endAt,
    allDay: request.allDay,
    color: request.color,
    createdOrder,
  };
}

function findMockEvent(eventId: string) {
  return mockSavedEvents.get(eventId) ?? null;
}

function collectMockEventsByDate(from: Date, to: Date) {
  const fromKey = formatDateKey(from);
  const toKey = formatDateKey(to);
  const eventsByDate = new Map<string, MockCalendarEvent[]>();
  mockSavedEvents.forEach(({ eventId, title, color, startDate, endDate, createdOrder }) => {
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

  const event = findMockEvent(eventId);

  if (!event) throw new Error("캘린더 일정을 찾을 수 없습니다.");

  const { createdOrder: _createdOrder, ...detail } = event;

  return detail;
}

export async function createMockCalendarEvent(
  request: CalendarEventCreateRequest,
): Promise<CalendarEventCreateResult> {
  await mockDelay();

  mockCreatedCount += 1;

  const createdOrder = 1000 + mockCreatedCount;
  const eventId = `${CREATED_EVENT_ID_PREFIX}${createdOrder}`;

  mockSavedEvents.set(eventId, toSavedEvent(eventId, request, createdOrder));

  return { eventId };
}

export async function updateMockCalendarEvent(
  eventId: string,
  request: CalendarEventUpdateRequest,
): Promise<void> {
  await mockDelay();

  const event = findMockEvent(eventId);

  if (!event) throw new Error("캘린더 일정을 찾을 수 없습니다.");

  mockSavedEvents.set(eventId, toSavedEvent(eventId, request, event.createdOrder));
}

export async function deleteMockCalendarEvent(eventId: string): Promise<void> {
  await mockDelay();

  if (!findMockEvent(eventId)) throw new Error("캘린더 일정을 찾을 수 없습니다.");

  mockSavedEvents.delete(eventId);
}
