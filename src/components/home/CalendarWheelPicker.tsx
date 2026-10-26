// 캘린더 연월 선택과 일정 시간 선택에서 함께 쓰는 휠 다이얼
"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import Picker, { type PickerValue } from "react-mobile-picker";

import styles from "./CalendarWheelPicker.module.css";

const PICKER_ITEM_HEIGHT = 44;
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * 5;
const PICKER_WHEEL_STEP_DELTA = 80;
const PICKER_WHEEL_RESET_MS = 200;
const WHEEL_LINE_HEIGHT = 16;

export type CalendarWheelColumn<TName extends string> = {
  name: TName;
  label: string;
  options: number[];
  formatOption: (option: number) => string;
};

type CalendarWheelPickerProps<TName extends string> = {
  columns: CalendarWheelColumn<TName>[];
  value: Record<TName, number>;
  onChange: (value: Record<TName, number>) => void;
};

function moveColumnValue<TName extends string>(
  value: Record<TName, number>,
  { name, options }: CalendarWheelColumn<TName>,
  offset: number,
) {
  const nextIndex = Math.min(
    Math.max(options.indexOf(value[name]) + offset, 0),
    options.length - 1,
  );

  return { ...value, [name]: options[nextIndex] };
}

export default function CalendarWheelPicker<TName extends string>({
  columns,
  value,
  onChange,
}: CalendarWheelPickerProps<TName>) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef({ columns, value, onChange });

  useEffect(() => {
    latestRef.current = { columns, value, onChange };
  });

  useEffect(() => {
    const picker = pickerRef.current;

    if (!picker) return;

    const accumulatedDelta = new Map<string, number>();
    let resetTimer: number | undefined;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const columnName = (event.target as HTMLElement).closest<HTMLElement>("[data-picker-column]")
        ?.dataset.pickerColumn;
      const column = latestRef.current.columns.find(({ name }) => name === columnName);

      if (!columnName || !column) return;

      const delta =
        (accumulatedDelta.get(columnName) ?? 0) +
        (event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * WHEEL_LINE_HEIGHT
          : event.deltaY);

      accumulatedDelta.set(columnName, delta);
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => accumulatedDelta.clear(), PICKER_WHEEL_RESET_MS);

      if (Math.abs(delta) < PICKER_WHEEL_STEP_DELTA) return;

      accumulatedDelta.set(columnName, 0);
      latestRef.current.onChange(
        moveColumnValue(latestRef.current.value, column, Math.sign(delta)),
      );
    };

    picker.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      picker.removeEventListener("wheel", handleWheel);
      window.clearTimeout(resetTimer);
    };
  }, []);

  const handleColumnKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    column: CalendarWheelColumn<TName>,
  ) => {
    const currentIndex = column.options.indexOf(value[column.name]);
    const nextIndexByKey: Record<string, number> = {
      ArrowUp: currentIndex - 1,
      ArrowDown: currentIndex + 1,
      Home: 0,
      End: column.options.length - 1,
    };
    const nextIndex = nextIndexByKey[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    onChange(moveColumnValue(value, column, nextIndex - currentIndex));
  };

  return (
    <div ref={pickerRef}>
      <Picker
        value={value as PickerValue}
        onChange={(nextValue) => onChange(nextValue as Record<TName, number>)}
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
            aria-valuetext={column.formatOption(value[column.name])}
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
                    {column.formatOption(option)}
                  </span>
                )}
              </Picker.Item>
            ))}
          </Picker.Column>
        ))}
      </Picker>
    </div>
  );
}
