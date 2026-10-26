// 일정 추가 폼에서 일정 색상을 고르는 바텀시트
"use client";

import { useState } from "react";

import ActionButton from "@/components/common/ActionButton";
import CalendarBottomSheet, {
  type CalendarBottomSheetState,
} from "@/components/home/CalendarBottomSheet";
import { CALENDAR_EVENT_COLORS } from "@/lib/calendarEventColors";
import type { CalendarEventColor } from "@/types/calendar";

type CalendarEventColorSheetProps = {
  state: CalendarBottomSheetState;
  value: CalendarEventColor;
  onClose: () => void;
  onClosed: () => void;
  onConfirm: (color: CalendarEventColor) => void;
};

const colorEntries = Object.entries(CALENDAR_EVENT_COLORS) as [
  CalendarEventColor,
  (typeof CALENDAR_EVENT_COLORS)[CalendarEventColor],
][];

function CalendarEventColorPicker({
  initialColor,
  onConfirm,
}: {
  initialColor: CalendarEventColor;
  onConfirm: (color: CalendarEventColor) => void;
}) {
  const [selectedColor, setSelectedColor] = useState(initialColor);

  return (
    <>
      <div role="radiogroup" aria-label="일정 색상" className="grid grid-cols-5 gap-y-4 py-2">
        {colorEntries.map(([color, { label, hex }]) => {
          const isSelected = color === selectedColor;

          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              className="mx-auto flex size-12 cursor-pointer items-center justify-center rounded-full border-0 p-0 text-surface transition-transform active:scale-95"
              style={{ backgroundColor: hex }}
              onClick={() => setSelectedColor(color)}
            >
              {isSelected && (
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5L10 17.5L19 7"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      <ActionButton className="mt-6" onClick={() => onConfirm(selectedColor)}>
        확인
      </ActionButton>
    </>
  );
}

export default function CalendarEventColorSheet({
  state,
  value,
  onClose,
  onClosed,
  onConfirm,
}: CalendarEventColorSheetProps) {
  return (
    <CalendarBottomSheet
      state={state}
      title="일정 색상 선택"
      isTitleHidden
      onClose={onClose}
      onClosed={onClosed}
    >
      <CalendarEventColorPicker initialColor={value} onConfirm={onConfirm} />
    </CalendarBottomSheet>
  );
}
