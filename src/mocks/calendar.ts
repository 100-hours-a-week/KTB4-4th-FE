// 캘린더 UI의 일정 수정·삭제용 메모리 기반 임시 CRUD 모듈

import { mockDelay } from "@/mocks/config";
import type {
  CalendarEventCreateRequest,
  CalendarEventCreateResult,
  CalendarEventDetail,
  CalendarEventUpdateRequest,
} from "@/types/calendar";

type MockSavedCalendarEvent = CalendarEventDetail & { createdOrder: number };

const CREATED_EVENT_ID_PREFIX = "created-";
const mockSavedEvents = new Map<string, MockSavedCalendarEvent>();
let mockCreatedCount = 0;

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
    notificationEnabled: request.notificationEnabled,
    color: request.color,
    createdOrder,
  };
}

function findMockEvent(eventId: string) {
  return mockSavedEvents.get(eventId) ?? null;
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
