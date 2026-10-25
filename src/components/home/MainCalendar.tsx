// 메인페이지에서 월별 이벤트 일정을 확인하는 캘린더 컴포넌트
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { DayPicker, labelDayButton, type DayButtonProps, type Labels } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { getCalendarEventColorHex } from "@/lib/calendarEventColors";
import { formatDateKey } from "@/lib/formatDateKey";
import { getMockCalendarSummary } from "@/mocks/calendar";
import type { CalendarDaySummary } from "@/types/calendar";

// 6주 고정 표시이므로 한 화면에 보이는 날짜 수
const VISIBLE_DAY_COUNT = 42;

// 날짜 아래에 표시하는 점의 최대 개수이며, 나머지 일정은 날짜별 일정 목록에서 확인
const MAX_VISIBLE_INDICATORS = 5;

// 날짜 버튼마다 일정 요약을 전달하기 위한 컨텍스트이며, 키는 YYYY-MM-DD 형식
const DaySummaryContext = createContext<ReadonlyMap<string, CalendarDaySummary>>(new Map());

// 앞뒤 달 날짜까지 포함해 캘린더에 보이는 첫날과 마지막 날 계산
function getVisibleRange(month: Date) {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const from = new Date(firstDayOfMonth);

  from.setDate(from.getDate() - firstDayOfMonth.getDay());

  const to = new Date(from);

  to.setDate(to.getDate() + VISIBLE_DAY_COUNT - 1);

  return { from, to };
}

// 날짜 숫자 아래에 일정마다 그 일정의 색으로 점을 표시하는 날짜 버튼
function CalendarDayButton({ day, modifiers, children, ...buttonProps }: DayButtonProps) {
  // 서버가 최근에 추가한 일정부터 내려주므로 앞에서부터 최대 개수만큼 표시
  const visibleIndicators =
    useContext(DaySummaryContext)
      .get(formatDateKey(day.date))
      ?.indicators.slice(0, MAX_VISIBLE_INDICATORS) ?? [];
  const ref = useRef<HTMLButtonElement>(null);
  const isToday = modifiers.today && !modifiers.outside;
  const isSunday = day.date.getDay() === 0;

  // 기본 DayButton과 같이 키보드로 이동한 날짜에 포커스를 옮김
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  // 오늘은 주황 원으로 채우고, 오늘이 아닌 선택 날짜는 주황 테두리 원으로 표시
  const dateCircleClassName = isToday
    ? "bg-birthday font-bold text-surface"
    : `${modifiers.selected ? "border-birthday" : "border-transparent"} ${
        isSunday ? "text-birthday" : "text-foreground"
      }`;

  return (
    <button ref={ref} {...buttonProps}>
      <span
        className={`flex size-8 items-center justify-center rounded-full border ${dateCircleClassName}`}
      >
        {children}
      </span>
      {visibleIndicators.length > 0 && (
        <span aria-hidden="true" className="mt-1 flex justify-center gap-0.5">
          {visibleIndicators.map(({ eventId, color }) => (
            <span
              key={eventId}
              className="size-1 rounded-full"
              style={{ backgroundColor: getCalendarEventColorHex(color) }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

export default function MainCalendar() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [daySummaries, setDaySummaries] = useState<ReadonlyMap<string, CalendarDaySummary>>(
    () => new Map(),
  );

  // 화면에 보이는 기간의 이벤트를 조회하고, 달을 빠르게 넘겨도 마지막 달의 결과만 반영함
  useEffect(() => {
    let isCurrent = true;
    const { from, to } = getVisibleRange(month);

    // TODO: 카카오 캘린더 일정 요약 조회 API 연동 후 mock 조회를 대체하고 실패 처리 추가
    void getMockCalendarSummary(from, to).then(({ items }) => {
      if (isCurrent) setDaySummaries(new Map(items.map((item) => [item.date, item])));
    });

    return () => {
      isCurrent = false;
    };
  }, [month]);

  // 스크린 리더에서 점 대신 날짜별 전체 일정 개수를 읽도록 기본 라벨에 덧붙임
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
    const eventCount = daySummaries.get(formatDateKey(date))?.eventCount ?? 0;

    return eventCount > 0 ? `${label}, 일정 ${eventCount}개` : label;
  };

  return (
    <section aria-label="이벤트 캘린더" className="bg-surface">
      {/* 이전/다음 화살표 대신 연월을 눌러 다이얼로 이동할 달을 고름 */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isMonthPickerOpen}
        aria-label={`${month.getFullYear()}년 ${month.getMonth() + 1}월, 연월 선택`}
        className="touch-target -ml-1 flex cursor-pointer items-center gap-1 rounded-sm border-0 bg-transparent px-1 text-foreground transition-colors active:bg-background-subtle"
        onClick={() => setIsMonthPickerOpen(true)}
      >
        {/* 전역 button 글꼴 상속 규칙보다 우선하도록 글자 스타일은 span에 적용 */}
        <span className="text-heading-2 font-bold">
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </span>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.5 6h9L8 11z" />
        </svg>
      </button>

      <DaySummaryContext value={daySummaries}>
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
          hideNavigation
          labels={{ labelDayButton: labelDayButtonWithEvents }}
          components={{ DayButton: CalendarDayButton }}
          classNames={{
            root: "w-full",
            months: "w-full",
            month: "w-full",
            // 연월은 위의 선택 버튼에 표시하므로 기본 제목은 숨기고, 표의 이름은 aria-label로 제공됨
            month_caption: "hidden",
            month_grid: "mt-2 w-full table-fixed border-collapse",
            weekdays: "border-b border-border",
            // 일요일 요일명만 날짜와 같은 주황색으로 구분
            weekday:
              "pb-2 text-center text-body-sm font-normal text-foreground first:text-birthday",
            weeks: "",
            week: "",
            day: "h-16 p-0 align-top",
            day_button:
              "flex h-full w-full cursor-pointer flex-col items-center rounded-sm border-0 bg-transparent p-0 pt-2 text-body-lg tabular-nums transition-colors active:bg-background-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground",
            today: "",
            focused: "",
            selected: "",
            // 앞뒤 달 날짜는 요일 색과 점을 유지한 채 전체를 흐리게 표시
            outside: "[&>button]:opacity-35",
            disabled: "[&>button]:text-disabled",
            hidden: "invisible",
          }}
        />
      </DaySummaryContext>
    </section>
  );
}
