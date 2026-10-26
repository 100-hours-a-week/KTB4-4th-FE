// 메인페이지에서 월별 이벤트 일정을 확인하는 캘린더 컴포넌트
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { DayPicker, labelDayButton, type DayButtonProps, type Labels } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import ActionButton from "@/components/common/ActionButton";
import CalendarBottomSheet, {
  type CalendarBottomSheetState,
} from "@/components/home/CalendarBottomSheet";
import CalendarEventDeleteModal from "@/components/home/CalendarEventDeleteModal";
import CalendarEventFormModal from "@/components/home/CalendarEventFormModal";
import CalendarEventListSheet from "@/components/home/CalendarEventListSheet";
import CalendarWheelPicker, {
  type CalendarWheelColumn,
} from "@/components/home/CalendarWheelPicker";
import { getCalendarEventColorHex } from "@/lib/calendarEventColors";
import { formatDateKey } from "@/lib/formatDateKey";
import {
  createMockCalendarEvent,
  deleteMockCalendarEvent,
  updateMockCalendarEvent,
  getMockCalendarEventDetail,
  getMockCalendarEventList,
  getMockCalendarSummary,
} from "@/mocks/calendar";
import type {
  CalendarDaySummary,
  CalendarEventCreateRequest,
  CalendarEventUpdateRequest,
  CalendarEventDetail,
  CalendarEventListItem,
} from "@/types/calendar";

const VISIBLE_DAY_COUNT = 42;

const MAX_VISIBLE_INDICATORS = 5;

const DaySummaryContext = createContext<ReadonlyMap<string, CalendarDaySummary>>(new Map());

function getVisibleRange(month: Date) {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const from = new Date(firstDayOfMonth);

  from.setDate(from.getDate() - firstDayOfMonth.getDay());

  const to = new Date(from);

  to.setDate(to.getDate() + VISIBLE_DAY_COUNT - 1);

  return { from, to };
}

function CalendarDayButton({ day, modifiers, children, ...buttonProps }: DayButtonProps) {
  const visibleIndicators =
    useContext(DaySummaryContext)
      .get(formatDateKey(day.date))
      ?.indicators.slice(0, MAX_VISIBLE_INDICATORS) ?? [];
  const ref = useRef<HTMLButtonElement>(null);
  const isToday = modifiers.today && !modifiers.outside;
  const isSunday = day.date.getDay() === 0;

  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

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

const PICKER_YEAR_RANGE = 10;
const PICKER_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

type MonthPickerValue = {
  year: number;
  month: number;
};

function getMonthPickerColumns(): CalendarWheelColumn<keyof MonthPickerValue>[] {
  const startYear = new Date().getFullYear() - PICKER_YEAR_RANGE;

  return [
    {
      name: "year",
      label: "연도",
      options: Array.from({ length: PICKER_YEAR_RANGE * 2 + 1 }, (_, index) => startYear + index),
      formatOption: (option) => `${option}년`,
    },
    { name: "month", label: "월", options: PICKER_MONTHS, formatOption: (option) => `${option}월` },
  ];
}

type MonthWheelPickerProps = {
  initialMonth: Date;
  onConfirm: (value: MonthPickerValue) => void;
};

function MonthWheelPicker({ initialMonth, onConfirm }: MonthWheelPickerProps) {
  const [value, setValue] = useState<MonthPickerValue>({
    year: initialMonth.getFullYear(),
    month: initialMonth.getMonth() + 1,
  });

  return (
    <>
      <CalendarWheelPicker columns={getMonthPickerColumns()} value={value} onChange={setValue} />
      <ActionButton className="mt-6" onClick={() => onConfirm(value)}>
        확인
      </ActionButton>
    </>
  );
}

export default function MainCalendar() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [monthPickerState, setMonthPickerState] = useState<CalendarBottomSheetState>("closed");
  const [eventCreateState, setEventCreateState] = useState<CalendarBottomSheetState>("closed");
  const [eventCreateFormKey, setEventCreateFormKey] = useState(0);
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const [eventEditState, setEventEditState] = useState<CalendarBottomSheetState>("closed");
  const [eventEditFormKey, setEventEditFormKey] = useState(0);
  const [isEventDeleteModalOpen, setIsEventDeleteModalOpen] = useState(false);
  const [isEventDeleting, setIsEventDeleting] = useState(false);
  const [eventDeleteErrorMessage, setEventDeleteErrorMessage] = useState<string | null>(null);
  const [daySummaries, setDaySummaries] = useState<ReadonlyMap<string, CalendarDaySummary>>(
    () => new Map(),
  );
  const [eventListState, setEventListState] = useState<CalendarBottomSheetState>("closed");
  const [eventListDate, setEventListDate] = useState<Date | null>(null);
  const [eventListItems, setEventListItems] = useState<CalendarEventListItem[]>([]);
  const [isEventListLoading, setIsEventListLoading] = useState(false);
  const [eventListErrorMessage, setEventListErrorMessage] = useState<string | null>(null);
  const eventListRequestIdRef = useRef(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetail, setEventDetail] = useState<CalendarEventDetail | null>(null);
  const [isEventDetailLoading, setIsEventDetailLoading] = useState(false);
  const [eventDetailErrorMessage, setEventDetailErrorMessage] = useState<string | null>(null);
  const eventDetailRequestIdRef = useRef(0);

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
  }, [month, summaryRefreshKey]);

  const createEvent = async (request: CalendarEventCreateRequest) => {
    // TODO: 카카오 캘린더 일정 생성 API 연동 후 mock 저장 대체
    await createMockCalendarEvent(request);

    setEventCreateState("closing");
    setSummaryRefreshKey((currentKey) => currentKey + 1);
  };

  const openEventList = async (date: Date) => {
    if ((daySummaries.get(formatDateKey(date))?.eventCount ?? 0) === 0) return;

    const requestId = eventListRequestIdRef.current + 1;

    eventListRequestIdRef.current = requestId;
    closeEventDetail();
    setEventListState("open");
    setEventListDate(date);
    setEventListItems([]);
    await loadEventList(date, requestId);
  };

  const loadEventList = async (date: Date, requestId = eventListRequestIdRef.current + 1) => {
    eventListRequestIdRef.current = requestId;
    setEventListErrorMessage(null);
    setIsEventListLoading(true);

    try {
      // TODO: 카카오 캘린더 날짜별 일정 목록 조회 API 연동 후 mock 조회 대체
      const { items } = await getMockCalendarEventList(date);

      if (eventListRequestIdRef.current === requestId) setEventListItems(items);

      return items;
    } catch {
      if (eventListRequestIdRef.current === requestId) {
        setEventListErrorMessage("일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }

      return null;
    } finally {
      if (eventListRequestIdRef.current === requestId) setIsEventListLoading(false);
    }
  };

  const closeEventList = () => {
    eventListRequestIdRef.current += 1;
    eventDetailRequestIdRef.current += 1;
    setEventListState("closing");
    setIsEventListLoading(false);
    setIsEventDetailLoading(false);
  };

  const clearEventList = () => {
    setEventListState("closed");
    setEventListDate(null);
    setEventListItems([]);
    setEventListErrorMessage(null);
    closeEventDetail();
  };

  const openEventDetail = async (eventId: string) => {
    const requestId = eventDetailRequestIdRef.current + 1;

    eventDetailRequestIdRef.current = requestId;
    setSelectedEventId(eventId);
    setEventDetail(null);
    setEventDetailErrorMessage(null);
    setIsEventDetailLoading(true);

    try {
      // TODO: 카카오 캘린더 일정 상세 조회 API 연동 후 mock 조회 대체
      const detail = await getMockCalendarEventDetail(eventId);

      if (eventDetailRequestIdRef.current === requestId) setEventDetail(detail);
    } catch {
      if (eventDetailRequestIdRef.current === requestId) {
        setEventDetailErrorMessage("일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      if (eventDetailRequestIdRef.current === requestId) setIsEventDetailLoading(false);
    }
  };

  const openEventEdit = () => {
    setEventEditFormKey((currentKey) => currentKey + 1);
    setEventEditState("open");
  };

  const updateEvent = async (request: CalendarEventUpdateRequest) => {
    if (!eventDetail) return;

    // TODO: 카카오 캘린더 일정 수정 API 연동 후 mock 수정 대체
    await updateMockCalendarEvent(eventDetail.eventId, request);

    setEventEditState("closing");
    setSummaryRefreshKey((currentKey) => currentKey + 1);
    void openEventDetail(eventDetail.eventId);

    if (eventListDate) void loadEventList(eventListDate);
  };

  const openEventDelete = () => {
    setEventDeleteErrorMessage(null);
    setIsEventDeleteModalOpen(true);
  };

  const deleteEvent = async () => {
    if (!eventDetail || isEventDeleting) return;

    setIsEventDeleting(true);
    setEventDeleteErrorMessage(null);

    try {
      // TODO: 카카오 캘린더 일정 삭제 API 연동 후 mock 삭제 대체 (401 로그인 이동, 403 CSRF 재발급 후 1회 재시도, 404 목록 재조회, 429 retryAfterSeconds 안내, 500 목록 유지)
      await deleteMockCalendarEvent(eventDetail.eventId);

      setIsEventDeleteModalOpen(false);
      closeEventDetail();
      setSummaryRefreshKey((currentKey) => currentKey + 1);

      const items = eventListDate ? await loadEventList(eventListDate) : [];

      if (items?.length === 0) closeEventList();
    } catch (error) {
      setEventDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : "일정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsEventDeleting(false);
    }
  };

  function closeEventDetail() {
    eventDetailRequestIdRef.current += 1;
    setSelectedEventId(null);
    setEventDetail(null);
    setEventDetailErrorMessage(null);
    setIsEventDetailLoading(false);
  }

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
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={monthPickerState === "open"}
          aria-label={`${month.getFullYear()}년 ${month.getMonth() + 1}월, 연월 선택`}
          className="touch-target -ml-1 flex cursor-pointer items-center gap-1 rounded-sm border-0 bg-transparent px-1 text-foreground transition-colors active:bg-background-subtle"
          onClick={() => setMonthPickerState("open")}
        >
          <span className="text-heading-2 font-bold">
            {month.getFullYear()}년 {month.getMonth() + 1}월
          </span>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.5 6h9L8 11z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="일정 추가"
          aria-haspopup="dialog"
          aria-expanded={eventCreateState === "open"}
          className="touch-target -mr-2 flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground transition-colors active:bg-background-subtle"
          onClick={() => {
            setEventCreateFormKey((currentKey) => currentKey + 1);
            setEventCreateState("open");
          }}
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <DaySummaryContext value={daySummaries}>
        <DayPicker
          mode="single"
          locale={ko}
          month={month}
          onMonthChange={setMonth}
          selected={selectedDate}
          onSelect={setSelectedDate}
          onDayClick={(date) => void openEventList(date)}
          showOutsideDays
          fixedWeeks
          hideNavigation
          labels={{ labelDayButton: labelDayButtonWithEvents }}
          components={{ DayButton: CalendarDayButton }}
          classNames={{
            root: "w-full",
            months: "w-full",
            month: "w-full",
            month_caption: "hidden",
            month_grid: "mt-2 w-full table-fixed border-collapse",
            weekdays: "border-b border-border",
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
            outside: "[&>button]:opacity-35",
            disabled: "[&>button]:text-disabled",
            hidden: "invisible",
          }}
        />
      </DaySummaryContext>

      <CalendarEventFormModal
        key={eventCreateFormKey}
        state={eventCreateState}
        initialDate={selectedDate ?? new Date()}
        onSubmit={createEvent}
        onClose={() => setEventCreateState("closing")}
        onClosed={() => setEventCreateState("closed")}
      />

      <CalendarEventListSheet
        state={eventListState}
        date={eventListDate}
        events={eventListItems}
        isLoading={isEventListLoading}
        errorMessage={eventListErrorMessage}
        detail={{
          isOpen: selectedEventId !== null,
          event: eventDetail,
          isLoading: isEventDetailLoading,
          errorMessage: eventDetailErrorMessage,
        }}
        onSelectEvent={(eventId) => void openEventDetail(eventId)}
        onBack={closeEventDetail}
        onEditEvent={openEventEdit}
        onDeleteEvent={openEventDelete}
        detailOverlay={
          eventDetail && (
            <>
              <CalendarEventFormModal
                key={eventEditFormKey}
                state={eventEditState}
                initialDate={new Date(eventDetail.startAt)}
                initialEvent={eventDetail}
                onSubmit={updateEvent}
                onClose={() => setEventEditState("closing")}
                onClosed={() => setEventEditState("closed")}
              />
              <CalendarEventDeleteModal
                open={isEventDeleteModalOpen}
                isDeleting={isEventDeleting}
                errorMessage={eventDeleteErrorMessage}
                onClose={() => setIsEventDeleteModalOpen(false)}
                onConfirm={() => void deleteEvent()}
              />
            </>
          )
        }
        onClose={closeEventList}
        onClosed={clearEventList}
      />

      <CalendarBottomSheet
        state={monthPickerState}
        title="연월 선택"
        isTitleHidden
        onClose={() => setMonthPickerState("closing")}
        onClosed={() => setMonthPickerState("closed")}
      >
        <MonthWheelPicker
          initialMonth={month}
          onConfirm={({ year, month: pickedMonth }) => {
            setMonth(new Date(year, pickedMonth - 1, 1));
            setMonthPickerState("closing");
          }}
        />
      </CalendarBottomSheet>
    </section>
  );
}
