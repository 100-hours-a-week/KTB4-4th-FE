// 메인페이지에서 월별 이벤트 일정을 확인하는 캘린더 컴포넌트
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  DayPicker,
  labelDayButton,
  type ChevronProps,
  type DayButtonProps,
  type Labels,
} from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { formatDateKey } from "@/lib/formatDateKey";
import { getMockCalendarEvents } from "@/mocks/calendar";
import type { CalendarEvent } from "@/types/calendar";

// 6주 고정 표시이므로 한 화면에 보이는 날짜 수
const VISIBLE_DAY_COUNT = 42;

// 날짜 버튼마다 이벤트 개수를 전달하기 위한 컨텍스트이며, 키는 YYYY-MM-DD 형식
const EventCountContext = createContext<ReadonlyMap<string, number>>(new Map());

// 앞뒤 달 날짜까지 포함해 캘린더에 보이는 첫날과 마지막 날 계산
function getVisibleRange(month: Date) {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const from = new Date(firstDayOfMonth);

  from.setDate(from.getDate() - firstDayOfMonth.getDay());

  const to = new Date(from);

  to.setDate(to.getDate() + VISIBLE_DAY_COUNT - 1);

  return { from, to };
}

function countEventsByDate(events: CalendarEvent[]) {
  const counts = new Map<string, number>();

  events.forEach(({ date }) => counts.set(date, (counts.get(date) ?? 0) + 1));

  return counts;
}

function CalendarChevron({ orientation = "right", className }: ChevronProps) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={`${className ?? ""} ${orientation === "left" ? "rotate-180" : ""}`}
    >
      <path
        d="M7.5 4L13.5 10L7.5 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 날짜 아래에 이벤트 개수만큼 점을 표시하는 날짜 버튼
function CalendarDayButton({ day, modifiers, children, ...buttonProps }: DayButtonProps) {
  const eventCount = useContext(EventCountContext).get(formatDateKey(day.date)) ?? 0;
  const ref = useRef<HTMLButtonElement>(null);

  // 기본 DayButton과 같이 키보드로 이동한 날짜에 포커스를 옮김
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button ref={ref} {...buttonProps}>
      {children}
      {eventCount > 0 && (
        <span aria-hidden="true" className="mt-1 flex flex-wrap gap-0.5">
          {Array.from({ length: eventCount }, (_, index) => (
            // 앞뒤 달 날짜에서는 숫자와 함께 흐리게 보이도록 글자 색을 따름
            <span key={index} className="size-1 rounded-full bg-current" />
          ))}
        </span>
      )}
    </button>
  );
}

export default function MainCalendar() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [eventCounts, setEventCounts] = useState<ReadonlyMap<string, number>>(() => new Map());

  // 화면에 보이는 기간의 이벤트를 조회하고, 달을 빠르게 넘겨도 마지막 달의 결과만 반영함
  useEffect(() => {
    let isCurrent = true;
    const { from, to } = getVisibleRange(month);

    // TODO: 카카오 캘린더 생일 API와 일정 조회 API 연동 후 mock 조회를 대체하고 실패 처리 추가
    void getMockCalendarEvents(from, to).then((events) => {
      if (isCurrent) setEventCounts(countEventsByDate(events));
    });

    return () => {
      isCurrent = false;
    };
  }, [month]);

  // 스크린 리더에서 점 대신 날짜별 일정 개수를 읽도록 기본 라벨에 덧붙임
  const labelDayButtonWithEvents: Labels["labelDayButton"] = (
    date,
    modifiers,
    options,
    dateLib,
  ) => {
    const localeLabel = ko.labels?.labelDayButton;
    const label =
      typeof localeLabel === "function"
        ? localeLabel(date, modifiers, options, dateLib)
        : (localeLabel ?? labelDayButton(date, modifiers, options, dateLib));
    const eventCount = eventCounts.get(formatDateKey(date)) ?? 0;

    return eventCount > 0 ? `${label}, 일정 ${eventCount}개` : label;
  };

  return (
    <section aria-label="이벤트 캘린더" className="rounded-md border border-border-strong p-4">
      <EventCountContext value={eventCounts}>
        <DayPicker
          mode="single"
          locale={ko}
          month={month}
          onMonthChange={setMonth}
          selected={selectedDate}
          onSelect={setSelectedDate}
          showOutsideDays
          // 달마다 주 수가 달라도 캘린더 높이가 바뀌지 않도록 항상 6주 표시
          fixedWeeks
          navLayout="around"
          formatters={{
            formatCaption: (date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
          }}
          labels={{ labelDayButton: labelDayButtonWithEvents }}
          components={{ Chevron: CalendarChevron, DayButton: CalendarDayButton }}
          classNames={{
            root: "w-full",
            months: "w-full",
            month: "grid w-full grid-cols-[auto_1fr_auto] items-center",
            month_caption: "col-start-2 row-start-1 flex justify-center",
            caption_label: "text-heading-3 font-bold",
            button_previous:
              "col-start-1 row-start-1 touch-target flex items-center justify-center border-0 bg-transparent p-0 text-foreground",
            button_next:
              "col-start-3 row-start-1 touch-target flex items-center justify-center border-0 bg-transparent p-0 text-foreground",
            chevron: "",
            month_grid: "col-span-3 mt-2 w-full table-fixed border-collapse",
            weekdays: "",
            weekday: "pb-2 text-center text-caption font-bold text-foreground-secondary",
            weeks: "",
            week: "",
            day: "h-14 p-0 align-top",
            day_button:
              "flex h-full w-full cursor-pointer flex-col items-start rounded-sm border border-transparent bg-transparent px-1 pt-1 text-body-sm text-foreground tabular-nums transition-colors active:bg-background-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground",
            // TODO: 오늘 날짜 강조 방식은 화면 설계서에 정의되지 않아 임시로 굵게 표시
            today: "[&>button]:font-bold",
            selected: "[&>button]:border-foreground",
            outside: "[&>button]:text-muted",
            disabled: "[&>button]:text-disabled",
            hidden: "invisible",
          }}
        />
      </EventCountContext>
    </section>
  );
}
