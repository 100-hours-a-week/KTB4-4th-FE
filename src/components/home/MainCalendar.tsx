// 메인페이지의 연월 및 날짜 선택 캘린더 컴포넌트
"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, labelDayButton, type DayButtonProps, type Labels } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import ActionButton from "@/components/common/ActionButton";
import CalendarBottomSheet, {
  type CalendarBottomSheetState,
} from "@/components/home/CalendarBottomSheet";
import CalendarWheelPicker, {
  type CalendarWheelColumn,
} from "@/components/home/CalendarWheelPicker";

function CalendarDayButton({ day, modifiers, children, ...buttonProps }: DayButtonProps) {
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

  const labelCalendarDayButton: Labels["labelDayButton"] = (date, modifiers, options, dateLib) => {
    const localeLabel = ko.labels?.labelDayButton;
    const label =
      typeof localeLabel === "function"
        ? localeLabel(date, modifiers, options, dateLib)
        : (localeLabel ?? labelDayButton(date, modifiers, options, dateLib));
    return label;
  };

  return (
    <section aria-label="이벤트 캘린더" className="bg-surface">
      <div className="flex items-center">
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
      </div>

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
        labels={{ labelDayButton: labelCalendarDayButton }}
        components={{ DayButton: CalendarDayButton }}
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full",
          month_caption: "hidden",
          month_grid: "mt-2 w-full table-fixed border-collapse",
          weekdays: "border-b border-border",
          weekday: "pb-2 text-center text-body-sm font-normal text-foreground first:text-birthday",
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
