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

// 다이얼에서 고를 수 있는 연도는 올해 기준 앞뒤 10년
const PICKER_YEAR_RANGE = 10;
const PICKER_ITEM_HEIGHT = 44;
// 가운데 선택 줄과 위아래 두 칸씩 보이는 높이
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * 5;
const PICKER_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
// 휠·트랙패드 스크롤이 이만큼(px) 누적될 때마다 한 칸 이동
const PICKER_WHEEL_STEP_DELTA = 80;
// 마지막 휠 입력 후 이 시간이 지나면 누적된 스크롤 양을 초기화
const PICKER_WHEEL_RESET_MS = 200;
// 휠 이벤트가 줄 단위로 들어오는 경우 픽셀로 환산할 한 줄 높이
const WHEEL_LINE_HEIGHT = 16;

type MonthPickerValue = {
  year: number;
  // 1~12월
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

// 선택 값을 해당 열에서 지정한 칸 수만큼 옮기며, 처음과 끝을 넘어가지 않음
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

// 연·월 휠 다이얼과 확인 버튼이며, 시트를 열 때마다 현재 캘린더 연월로 초기화됨
function MonthWheelPicker({ initialMonth, onConfirm }: MonthWheelPickerProps) {
  const [value, setValue] = useState<MonthPickerValue>({
    year: initialMonth.getFullYear(),
    month: initialMonth.getMonth() + 1,
  });
  const pickerRef = useRef<HTMLDivElement>(null);
  const columns = getPickerColumns();

  // 라이브러리 휠 처리는 이벤트마다 최소 한 칸씩 움직여 트랙패드에서 너무 빠르므로,
  // 스크롤 양을 누적해 일정량마다 한 칸씩만 이동하도록 직접 처리함
  useEffect(() => {
    const picker = pickerRef.current;

    if (!picker) return;

    const accumulatedDelta: Record<keyof MonthPickerValue, number> = { year: 0, month: 0 };
    let resetTimer: number | undefined;

    const handleWheel = (event: WheelEvent) => {
      // 다이얼 위에서 휠을 돌릴 때 뒤 페이지가 스크롤되지 않도록 막음
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

  // 라이브러리가 키보드 조작을 지원하지 않아 방향키로 한 칸씩, Home·End로 처음·끝으로 이동
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

// closing은 닫힘 애니메이션이 재생 중인 상태이며, 애니메이션이 끝나면 closed로 바뀜
type MonthPickerSheetState = "closed" | "open" | "closing";

type MonthPickerSheetProps = {
  state: MonthPickerSheetState;
  month: Date;
  onClose: () => void;
  onClosed: () => void;
  onConfirm: (value: MonthPickerValue) => void;
};

// 캘린더에서 이동할 연월을 고르는 바텀시트
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
        // 내용 영역이 시트 전체를 채우므로 dialog 자체가 눌린 경우는 바깥 오버레이를 누른 경우
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
          {/* 닫혀 있을 때는 다이얼을 그리지 않아, 다시 열면 현재 캘린더 연월부터 시작함 */}
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
        aria-expanded={monthPickerState === "open"}
        aria-label={`${month.getFullYear()}년 ${month.getMonth() + 1}월, 연월 선택`}
        className="touch-target -ml-1 flex cursor-pointer items-center gap-1 rounded-sm border-0 bg-transparent px-1 text-foreground transition-colors active:bg-background-subtle"
        onClick={() => setMonthPickerState("open")}
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

      <MonthPickerSheet
        state={monthPickerState}
        month={month}
        onClose={() => setMonthPickerState("closing")}
        onClosed={() => setMonthPickerState("closed")}
        // 고른 연월로 이동하면 해당 기간의 일정을 다시 조회하며, 선택해 둔 날짜는 유지함
        onConfirm={({ year, month: pickedMonth }) => {
          setMonth(new Date(year, pickedMonth - 1, 1));
          setMonthPickerState("closing");
        }}
      />
    </section>
  );
}
