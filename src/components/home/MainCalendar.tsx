// 메인페이지에서 월별 이벤트 일정을 확인하는 캘린더 컴포넌트
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { DayPicker, labelDayButton, type DayButtonProps, type Labels } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import Picker from "react-mobile-picker";

import ActionButton from "@/components/common/ActionButton";
import useDialogControl from "@/hooks/useDialogControl";
import { getCalendarEventColorHex } from "@/lib/calendarEventColors";
import { formatDateKey } from "@/lib/formatDateKey";
import { getMockCalendarSummary } from "@/mocks/calendar";
import type { CalendarDaySummary } from "@/types/calendar";

import styles from "./MainCalendar.module.css";

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
const PICKER_ITEM_HEIGHT = 44;
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * 5;
const PICKER_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const PICKER_WHEEL_STEP_DELTA = 80;
const PICKER_WHEEL_RESET_MS = 200;
const WHEEL_LINE_HEIGHT = 16;

type MonthPickerValue = {
  year: number;
  month: number;
};

type MonthPickerColumn = {
  name: keyof MonthPickerValue;
  label: string;
  unit: string;
  options: number[];
};

function getPickerColumns(): MonthPickerColumn[] {
  const startYear = new Date().getFullYear() - PICKER_YEAR_RANGE;

  return [
    {
      name: "year",
      label: "연도",
      unit: "년",
      options: Array.from({ length: PICKER_YEAR_RANGE * 2 + 1 }, (_, index) => startYear + index),
    },
    { name: "month", label: "월", unit: "월", options: PICKER_MONTHS },
  ];
}

function movePickerValue(
  value: MonthPickerValue,
  name: keyof MonthPickerValue,
  offset: number,
): MonthPickerValue {
  const options = getPickerColumns().find((column) => column.name === name)?.options ?? [];
  const nextIndex = Math.min(
    Math.max(options.indexOf(value[name]) + offset, 0),
    options.length - 1,
  );

  return { ...value, [name]: options[nextIndex] };
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
  const pickerRef = useRef<HTMLDivElement>(null);
  const columns = getPickerColumns();

  useEffect(() => {
    const picker = pickerRef.current;

    if (!picker) return;

    const accumulatedDelta: Record<keyof MonthPickerValue, number> = { year: 0, month: 0 };
    let resetTimer: number | undefined;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const columnName = (event.target as HTMLElement).closest<HTMLElement>("[data-picker-column]")
        ?.dataset.pickerColumn as keyof MonthPickerValue | undefined;

      if (!columnName) return;

      accumulatedDelta[columnName] +=
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * WHEEL_LINE_HEIGHT
          : event.deltaY;

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        accumulatedDelta.year = 0;
        accumulatedDelta.month = 0;
      }, PICKER_WHEEL_RESET_MS);

      if (Math.abs(accumulatedDelta[columnName]) < PICKER_WHEEL_STEP_DELTA) return;

      const offset = Math.sign(accumulatedDelta[columnName]);

      accumulatedDelta[columnName] = 0;
      setValue((currentValue) => movePickerValue(currentValue, columnName, offset));
    };

    picker.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      picker.removeEventListener("wheel", handleWheel);
      window.clearTimeout(resetTimer);
    };
  }, []);

  const handleColumnKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    { name, options }: MonthPickerColumn,
  ) => {
    const currentIndex = options.indexOf(value[name]);
    const nextIndexByKey: Record<string, number> = {
      ArrowUp: currentIndex - 1,
      ArrowDown: currentIndex + 1,
      Home: 0,
      End: options.length - 1,
    };
    const nextIndex = nextIndexByKey[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    setValue((currentValue) =>
      movePickerValue(currentValue, name, nextIndex - options.indexOf(currentValue[name])),
    );
  };

  return (
    <>
      <div ref={pickerRef}>
        <Picker
          value={value}
          onChange={setValue}
          height={PICKER_HEIGHT}
          itemHeight={PICKER_ITEM_HEIGHT}
          className={styles.picker}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md bg-background-subtle"
            style={{ height: PICKER_ITEM_HEIGHT }}
          />
          {columns.map((column) => (
            <Picker.Column
              key={column.name}
              name={column.name}
              data-picker-column={column.name}
              role="spinbutton"
              tabIndex={0}
              aria-label={column.label}
              aria-valuemin={column.options[0]}
              aria-valuemax={column.options[column.options.length - 1]}
              aria-valuenow={value[column.name]}
              aria-valuetext={`${value[column.name]}${column.unit}`}
              onKeyDown={(event) => handleColumnKeyDown(event, column)}
              className="cursor-grab outline-none"
            >
              {column.options.map((option) => (
                <Picker.Item key={option} value={option} aria-hidden="true">
                  {({ selected }) => (
                    <span
                      className={`tabular-nums transition-colors ${
                        selected
                          ? "text-heading-2 font-bold text-foreground"
                          : "text-heading-3 text-muted"
                      }`}
                    >
                      {option}
                      {column.unit}
                    </span>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>
          ))}
        </Picker>
      </div>
      <ActionButton className="mt-6" onClick={() => onConfirm(value)}>
        확인
      </ActionButton>
    </>
  );
}

type MonthPickerSheetState = "closed" | "open" | "closing";

type MonthPickerSheetProps = {
  state: MonthPickerSheetState;
  month: Date;
  onClose: () => void;
  onClosed: () => void;
  onConfirm: (value: MonthPickerValue) => void;
};

function MonthPickerSheet({ state, month, onClose, onClosed, onConfirm }: MonthPickerSheetProps) {
  const dialogRef = useDialogControl({ open: state !== "closed" });
  const titleId = useId();

  return (
    <>
      {state !== "closed" && (
        <div
          aria-hidden="true"
          data-state={state}
          className={`${styles.overlay} pointer-events-none fixed inset-y-0 left-1/2 z-50 w-full max-w-[var(--app-max-width)] -translate-x-1/2 bg-overlay`}
        />
      )}
      <dialog
        ref={dialogRef}
        data-modal
        data-state={state}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && state === "closing") onClosed();
        }}
        className={`${styles.sheet} fixed inset-x-0 top-auto bottom-0 z-[60] m-0 mx-auto max-h-none w-full max-w-[var(--app-max-width)] rounded-t-xl border-0 bg-surface p-0 text-foreground`}
      >
        <div className="px-page pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <h2 id={titleId} className="sr-only">
            연월 선택
          </h2>
          {state !== "closed" && <MonthWheelPicker initialMonth={month} onConfirm={onConfirm} />}
        </div>
      </dialog>
    </>
  );
}

export default function MainCalendar() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [monthPickerState, setMonthPickerState] = useState<MonthPickerSheetState>("closed");
  const [daySummaries, setDaySummaries] = useState<ReadonlyMap<string, CalendarDaySummary>>(
    () => new Map(),
  );

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

      <DaySummaryContext value={daySummaries}>
        <DayPicker
          mode="single"
          locale={ko}
          month={month}
          onMonthChange={setMonth}
          selected={selectedDate}
          onSelect={setSelectedDate}
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

      <MonthPickerSheet
        state={monthPickerState}
        month={month}
        onClose={() => setMonthPickerState("closing")}
        onClosed={() => setMonthPickerState("closed")}
        onConfirm={({ year, month: pickedMonth }) => {
          setMonth(new Date(year, pickedMonth - 1, 1));
          setMonthPickerState("closing");
        }}
      />
    </section>
  );
}
