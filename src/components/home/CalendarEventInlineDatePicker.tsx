// 일정 추가 폼에서 날짜 줄 아래에 펼쳐지는 소형 월간 달력
"use client";

import { useState } from "react";
import { DayPicker, type ChevronProps } from "react-day-picker";
import { ko } from "react-day-picker/locale";

type CalendarEventInlineDatePickerProps = {
  value: Date;
  minDate?: Date;
  onChange: (date: Date) => void;
};

function InlineDatePickerChevron({ orientation = "right" }: ChevronProps) {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={orientation === "left" ? "rotate-180" : ""}
    >
      <path
        d="M9 5L16 12L9 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CalendarEventInlineDatePicker({
  value,
  minDate,
  onChange,
}: CalendarEventInlineDatePickerProps) {
  const [month, setMonth] = useState(value);

  return (
    <div className="rounded-md border border-border-strong px-3 py-2">
      <DayPicker
        mode="single"
        required
        locale={ko}
        month={month}
        onMonthChange={setMonth}
        selected={value}
        onSelect={onChange}
        disabled={minDate ? { before: minDate } : undefined}
        formatters={{
          formatCaption: (date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
        }}
        components={{ Chevron: InlineDatePickerChevron }}
        classNames={{
          root: "w-full",
          months: "relative w-full",
          month: "w-full",
          month_caption: "flex h-11 items-center px-1",
          caption_label: "text-body-lg font-bold",
          nav: "absolute top-0 right-0 flex",
          button_previous:
            "touch-target flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-info transition-colors active:bg-info-subtle disabled:cursor-not-allowed disabled:text-disabled",
          button_next:
            "touch-target flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-info transition-colors active:bg-info-subtle disabled:cursor-not-allowed disabled:text-disabled",
          chevron: "",
          month_grid: "mt-1 w-full table-fixed border-collapse",
          weekdays: "",
          weekday: "pb-1 text-center text-caption font-normal text-muted",
          weeks: "",
          week: "",
          day: "p-0 text-center",
          day_button:
            "mx-auto flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-body-lg text-foreground tabular-nums transition-colors active:bg-background-subtle disabled:cursor-not-allowed",
          today: "[&>button]:text-info",
          selected: "font-bold [&>button]:bg-info-subtle [&>button]:text-info",
          outside: "invisible",
          disabled: "[&>button]:text-disabled",
          hidden: "invisible",
          focused: "",
        }}
      />
    </div>
  );
}
