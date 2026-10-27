// 일정 목록 바텀시트 안에서 보여주는 일정 상세 화면
"use client";

import { getCalendarEventColorHex } from "@/lib/calendarEventColors";
import type { CalendarEventDetail } from "@/types/calendar";

type CalendarEventDetailViewProps = {
  event: CalendarEventDetail | null;
  isLoading: boolean;
  errorMessage: string | null;
};

function formatEventDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatEventTime(dateTime: string) {
  return new Date(dateTime).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventPeriod({ startDate, endDate, startAt, endAt, allDay }: CalendarEventDetail) {
  const start = formatEventDate(startDate);
  const datePeriod = startDate === endDate ? start : `${start} - ${formatEventDate(endDate)}`;

  if (allDay) return `${datePeriod} · 하루 종일`;

  const startTime = formatEventTime(startAt);
  const endTime = formatEventTime(endAt);

  return startDate === endDate
    ? `${start} ${startTime} - ${endTime}`
    : `${start} ${startTime} - ${formatEventDate(endDate)} ${endTime}`;
}

export default function CalendarEventDetailView({
  event,
  isLoading,
  errorMessage,
}: CalendarEventDetailViewProps) {
  if (isLoading || !event) {
    return (
      <p
        role={errorMessage && !isLoading ? "alert" : "status"}
        className="m-0 shrink-0 py-6 text-center text-body text-muted"
      >
        {isLoading ? "일정을 불러오는 중입니다." : errorMessage}
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain">
      <div className="flex gap-4 pb-5">
        <span
          aria-hidden="true"
          className="mt-1.5 size-4 shrink-0 rounded-full"
          style={{ backgroundColor: getCalendarEventColorHex(event.color) }}
        />
        <div className="min-w-0">
          <p className="m-0 text-heading-2 font-bold break-keep break-words text-foreground">
            {event.title}
          </p>
          <p className="m-0 mt-2 text-body text-foreground-secondary">{formatEventPeriod(event)}</p>
        </div>
      </div>

      {event.description && (
        <div className="flex gap-4 border-t border-border py-5">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="mt-0.5 shrink-0 text-muted"
          >
            <path
              d="M4 5H16M4 10H16M4 15H11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <p className="m-0 min-w-0 text-body whitespace-pre-wrap break-keep break-words text-foreground">
            <span className="sr-only">설명: </span>
            {event.description}
          </p>
        </div>
      )}
    </div>
  );
}
