// 캘린더 일정을 추가하거나 수정하는 가운데 모달 입력 폼
"use client";

import { useEffect, useId, useState } from "react";

import CalendarBottomSheet, {
  type CalendarBottomSheetState,
} from "@/components/home/CalendarBottomSheet";
import CalendarEventColorSheet from "@/components/home/CalendarEventColorSheet";
import CalendarEventInlineDatePicker from "@/components/home/CalendarEventInlineDatePicker";
import CalendarWheelPicker, {
  type CalendarWheelColumn,
} from "@/components/home/CalendarWheelPicker";
import { ApiRequestError } from "@/lib/api/client";
import {
  CALENDAR_EVENT_COLORS,
  DEFAULT_CALENDAR_EVENT_COLOR,
  getCalendarEventColorHex,
} from "@/lib/calendarEventColors";
import { formatDateKey } from "@/lib/formatDateKey";
import type {
  CalendarEventColor,
  CalendarEventCreateRequest,
  CalendarEventDetail,
} from "@/types/calendar";

type CalendarEventFormModalProps = {
  state: CalendarBottomSheetState;
  initialDate: Date;
  initialEvent?: CalendarEventDetail;
  onSubmit: (request: CalendarEventCreateRequest) => Promise<void>;
  onClose: () => void;
  onClosed: () => void;
};

type DateTimeEdge = "start" | "end";
type ExpandedField = `${DateTimeEdge}${"Date" | "Time"}`;

type TimeValue = {
  hour: number;
  minute: number;
};

const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_STEP = 5;
const MAX_TITLE_LENGTH = 50;
const ERROR_DISPLAY_DURATION_MS = 3000;

const timeColumns: CalendarWheelColumn<keyof TimeValue>[] = [
  {
    name: "hour",
    label: "시",
    options: Array.from({ length: 24 }, (_, index) => index),
    formatOption: (option) => String(option).padStart(2, "0"),
  },
  {
    name: "minute",
    label: "분",
    options: Array.from({ length: 60 / MINUTE_STEP }, (_, index) => index * MINUTE_STEP),
    formatOption: (option) => String(option).padStart(2, "0"),
  },
];

function getInitialStartAt(initialDate: Date) {
  const nextHour = Math.min(new Date().getHours() + 1, 23);

  return new Date(
    initialDate.getFullYear(),
    initialDate.getMonth(),
    initialDate.getDate(),
    nextHour,
  );
}

function withDate(dateTime: Date, date: Date) {
  const nextDateTime = new Date(dateTime);

  nextDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());

  return nextDateTime;
}

function formatFormDate(date: Date) {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
  });
}

function withTime(dateTime: Date, { hour, minute }: TimeValue) {
  const nextDateTime = new Date(dateTime);

  nextDateTime.setHours(hour, minute, 0, 0);

  return nextDateTime;
}

function toTimeValue(dateTime: Date): TimeValue {
  return {
    hour: dateTime.getHours(),
    minute: Math.floor(dateTime.getMinutes() / MINUTE_STEP) * MINUTE_STEP,
  };
}

function formatFormTime(dateTime: Date) {
  return dateTime.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}

function toKstIsoString(dateTime: Date) {
  const hour = String(dateTime.getHours()).padStart(2, "0");
  const minute = String(dateTime.getMinutes()).padStart(2, "0");

  return `${formatDateKey(dateTime)}T${hour}:${minute}:00+09:00`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getSaveErrorMessage(error: unknown, fallbackMessage: string) {
  if (!(error instanceof ApiRequestError)) return fallbackMessage;

  if (error.status === 429 && error.retryAfterSeconds !== undefined) {
    return `${error.message} ${error.retryAfterSeconds}초 후 다시 시도해 주세요.`;
  }

  return error.message;
}

const formTextByMode = {
  create: {
    title: "일정 추가",
    submit: "저장",
    submitting: "저장 중",
    error: "일정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },
  edit: {
    title: "일정 수정",
    submit: "수정",
    submitting: "수정 중",
    error: "일정을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },
};

export default function CalendarEventFormModal({
  state,
  initialDate,
  initialEvent,
  onSubmit,
  onClose,
  onClosed,
}: CalendarEventFormModalProps) {
  const formText = formTextByMode[initialEvent ? "edit" : "create"];
  const titleInputId = useId();
  const allDayLabelId = useId();
  const notificationLabelId = useId();
  const notificationDescriptionId = useId();
  const descriptionInputId = useId();
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [description, setDescription] = useState(initialEvent?.description ?? "");
  const [color, setColor] = useState<CalendarEventColor>(
    initialEvent?.color ?? DEFAULT_CALENDAR_EVENT_COLOR,
  );
  const [colorSheetState, setColorSheetState] = useState<CalendarBottomSheetState>("closed");
  const [startAt, setStartAt] = useState(() =>
    initialEvent ? new Date(initialEvent.startAt) : getInitialStartAt(initialDate),
  );
  const [endAt, setEndAt] = useState(() =>
    initialEvent
      ? new Date(initialEvent.endAt)
      : new Date(getInitialStartAt(initialDate).getTime() + HOUR_IN_MS),
  );
  const [isAllDay, setIsAllDay] = useState(initialEvent?.allDay ?? false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(
    initialEvent?.notificationEnabled ?? false,
  );
  const [expandedField, setExpandedField] = useState<ExpandedField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const isSaveDisabled = title.trim() === "" || isSaving;

  useEffect(() => {
    if (!saveErrorMessage) return;

    const timer = window.setTimeout(() => {
      setSaveErrorMessage(null);
    }, ERROR_DISPLAY_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [saveErrorMessage]);

  const saveEvent = async () => {
    if (isSaveDisabled) return;

    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      await onSubmit({
        title: title.trim(),
        startAt: toKstIsoString(isAllDay ? startOfDay(startAt) : startAt),
        endAt: toKstIsoString(isAllDay ? startOfDay(endAt) : endAt),
        allDay: isAllDay,
        description: description.trim() || null,
        color,
        notificationEnabled: isNotificationEnabled,
      });
    } catch (error) {
      setSaveErrorMessage(getSaveErrorMessage(error, formText.error));
      setIsSaving(false);
    }
  };

  const toggleField = (field: ExpandedField) => {
    setExpandedField((currentField) => (currentField === field ? null : field));
  };

  const changeStartAt = (nextStartAt: Date) => {
    setStartAt(nextStartAt);
    setEndAt(new Date(nextStartAt.getTime() + (endAt.getTime() - startAt.getTime())));
  };

  const changeEndAt = (nextEndAt: Date) => {
    setEndAt(nextEndAt < startAt ? new Date(startAt) : nextEndAt);
  };

  const toggleAllDay = () => {
    setIsAllDay((currentIsAllDay) => !currentIsAllDay);
    setExpandedField((currentField) => (currentField?.endsWith("Time") ? null : currentField));
  };

  const toggleNotification = () => {
    setIsNotificationEnabled((currentIsNotificationEnabled) => !currentIsNotificationEnabled);
  };

  const dateTimeRows: { edge: DateTimeEdge; label: string; value: Date }[] = [
    { edge: "start", label: "시작", value: startAt },
    { edge: "end", label: "종료", value: endAt },
  ];

  return (
    <CalendarBottomSheet
      state={state}
      title={formText.title}
      isTitleHidden
      isCenteredModal
      headerStart={
        <button
          type="button"
          aria-label={`${formText.title} 닫기`}
          className="touch-target flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground transition-colors active:bg-background-subtle"
          onClick={onClose}
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      }
      headerEnd={
        <button
          type="button"
          disabled={isSaveDisabled}
          aria-busy={isSaving}
          className="touch-target flex cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent px-2 text-foreground transition-colors active:bg-background-subtle disabled:cursor-not-allowed disabled:text-muted"
          onClick={() => void saveEvent()}
        >
          <span className="text-body-lg font-bold">
            {isSaving ? formText.submitting : formText.submit}
          </span>
        </button>
      }
      onClose={onClose}
      onClosed={onClosed}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="flex items-center gap-2 border-b border-border-strong pb-2">
          <button
            type="button"
            aria-label={`일정 색상 선택, 현재 ${CALENDAR_EVENT_COLORS[color].label}`}
            aria-haspopup="dialog"
            aria-expanded={colorSheetState === "open"}
            className="touch-target -ml-2.5 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors active:bg-background-subtle"
            onClick={() => setColorSheetState("open")}
          >
            <span
              aria-hidden="true"
              className="size-5 rounded-full"
              style={{ backgroundColor: getCalendarEventColorHex(color) }}
            />
          </button>
          <div className="min-w-0 flex-1 font-system-ko text-heading-3">
            <label htmlFor={titleInputId} className="sr-only">
              일정 제목
            </label>
            <input
              id={titleInputId}
              type="text"
              value={title}
              placeholder="일정 제목을 입력해 주세요."
              autoComplete="off"
              maxLength={MAX_TITLE_LENGTH}
              className="w-full border-0 bg-transparent p-0 text-foreground outline-none select-text placeholder:text-muted"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="mt-3 shrink-0 text-foreground-secondary"
          >
            <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 6V10H13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="min-w-0 flex-1">
            {dateTimeRows.map(({ edge, label, value }) => {
              const dateField: ExpandedField = `${edge}Date`;
              const timeField: ExpandedField = `${edge}Time`;
              const changeValue = edge === "start" ? changeStartAt : changeEndAt;

              return (
                <div key={edge} className="border-b border-border">
                  <div className="flex min-h-14 items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-label={`${label} 날짜, ${formatFormDate(value)}`}
                      aria-expanded={expandedField === dateField}
                      className={`flex min-w-0 cursor-pointer items-center border-0 bg-transparent p-0 text-left transition-colors ${
                        expandedField === dateField ? "text-info" : "text-foreground"
                      }`}
                      onClick={() => toggleField(dateField)}
                    >
                      <span className="text-body-lg tabular-nums">{formatFormDate(value)}</span>
                    </button>
                    {!isAllDay && (
                      <button
                        type="button"
                        aria-label={`${label} 시간, ${formatFormTime(value)}`}
                        aria-expanded={expandedField === timeField}
                        className={`flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0 transition-colors ${
                          expandedField === timeField ? "text-info" : "text-foreground"
                        }`}
                        onClick={() => toggleField(timeField)}
                      >
                        <span className="text-body-lg tabular-nums">{formatFormTime(value)}</span>
                      </button>
                    )}
                  </div>
                  {expandedField === dateField && (
                    <div className="pb-3">
                      <CalendarEventInlineDatePicker
                        value={value}
                        minDate={edge === "end" ? startOfDay(startAt) : undefined}
                        onChange={(date) => changeValue(withDate(value, date))}
                      />
                    </div>
                  )}
                  {expandedField === timeField && (
                    <div className="pb-3">
                      <div className="rounded-md border border-border-strong px-3">
                        <CalendarWheelPicker
                          columns={timeColumns}
                          value={toTimeValue(value)}
                          onChange={(time) => changeValue(withTime(value, time))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border">
              <span id={allDayLabelId} className="text-body-lg">
                하루 종일
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isAllDay}
                aria-labelledby={allDayLabelId}
                className="relative h-touch w-11 shrink-0 cursor-pointer border-0 bg-transparent p-0"
                onClick={toggleAllDay}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 left-0 h-5 w-11 -translate-y-1/2 rounded-full transition-colors duration-200 ${
                    isAllDay ? "bg-primary" : "bg-disabled"
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface shadow-sm transition-[left] duration-200 ${
                      isAllDay ? "left-[26px]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>

            <div className="border-b border-border pb-3">
              <div className="flex min-h-14 items-center justify-between gap-4">
                <span id={notificationLabelId} className="text-body-lg">
                  알림 허용
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isNotificationEnabled}
                  aria-labelledby={notificationLabelId}
                  aria-describedby={notificationDescriptionId}
                  className="relative h-touch w-11 shrink-0 cursor-pointer border-0 bg-transparent p-0"
                  onClick={toggleNotification}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-1/2 left-0 h-5 w-11 -translate-y-1/2 rounded-full transition-colors duration-200 ${
                      isNotificationEnabled ? "bg-primary" : "bg-disabled"
                    }`}
                  >
                    <span
                      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface shadow-sm transition-[left] duration-200 ${
                        isNotificationEnabled ? "left-[26px]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              </div>
              <p
                id={notificationDescriptionId}
                className="m-0 whitespace-nowrap text-caption text-muted"
              >
                일정 시작 하루 전, 3일 전, 7일 전에 알림을 받을 수 있어요
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="mt-0.5 shrink-0 text-foreground-secondary"
          >
            <path
              d="M4 5H16M4 10H16M4 15H11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <div className="min-w-0 flex-1 font-system-ko text-body-lg">
            <label htmlFor={descriptionInputId} className="sr-only">
              일정 설명
            </label>
            <textarea
              id={descriptionInputId}
              value={description}
              placeholder="설명 추가"
              rows={4}
              className="block w-full resize-none border-0 bg-transparent p-0 text-foreground outline-none select-text placeholder:text-muted"
              onChange={(event) => setDescription(event.target.value)}
            />
            {saveErrorMessage && (
              <p
                role="alert"
                className="m-0 mt-3 rounded-sm bg-danger-subtle px-3 py-2 text-body-sm text-danger"
              >
                {saveErrorMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <CalendarEventColorSheet
        state={colorSheetState}
        value={color}
        onClose={() => setColorSheetState("closing")}
        onClosed={() => setColorSheetState("closed")}
        onConfirm={(nextColor) => {
          setColor(nextColor);
          setColorSheetState("closing");
        }}
      />
    </CalendarBottomSheet>
  );
}
