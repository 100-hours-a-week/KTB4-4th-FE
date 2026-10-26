// 캘린더에서 선택한 날짜의 일정 목록과 일정 상세를 전환해 보여주는 바텀시트
"use client";

import ActionButton from "@/components/common/ActionButton";
import CalendarBottomSheet, {
  type CalendarBottomSheetState,
} from "@/components/home/CalendarBottomSheet";
import CalendarEventActionMenu from "@/components/home/CalendarEventActionMenu";
import CalendarEventDetailView from "@/components/home/CalendarEventDetailView";
import { getCalendarEventColorHex } from "@/lib/calendarEventColors";
import type { CalendarEventDetail, CalendarEventListItem } from "@/types/calendar";

import type { ReactNode } from "react";

type CalendarEventDetailState = {
  isOpen: boolean;
  event: CalendarEventDetail | null;
  isLoading: boolean;
  errorMessage: string | null;
};

type CalendarEventListSheetProps = {
  state: CalendarBottomSheetState;
  date: Date | null;
  events: CalendarEventListItem[];
  isLoading: boolean;
  errorMessage: string | null;
  detail: CalendarEventDetailState;
  onSelectEvent: (eventId: string) => void;
  onBack: () => void;
  onEditEvent: () => void;
  onDeleteEvent: () => void;
  detailOverlay?: ReactNode;
  onClose: () => void;
  onClosed: () => void;
};

function formatSheetTitle(date: Date) {
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
}

export default function CalendarEventListSheet({
  state,
  date,
  events,
  isLoading,
  errorMessage,
  detail,
  onSelectEvent,
  onBack,
  onEditEvent,
  onDeleteEvent,
  detailOverlay,
  onClose,
  onClosed,
}: CalendarEventListSheetProps) {
  const statusMessage = isLoading ? "일정을 불러오는 중입니다." : errorMessage;

  if (detail.isOpen) {
    return (
      <CalendarBottomSheet
        state={state}
        title={detail.event?.title ?? "일정 상세"}
        isTitleHidden
        heightClassName="h-[60dvh]"
        headerStart={
          <button
            type="button"
            aria-label="일정 목록으로 돌아가기"
            className="touch-target flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground transition-colors active:bg-background-subtle"
            onClick={onBack}
          >
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 5L8 12L15 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        }
        headerEnd={
          detail.event && <CalendarEventActionMenu onEdit={onEditEvent} onDelete={onDeleteEvent} />
        }
        onClose={onClose}
        onClosed={onClosed}
      >
        <CalendarEventDetailView
          event={detail.event}
          isLoading={detail.isLoading}
          errorMessage={detail.errorMessage}
        />
        {detailOverlay}
      </CalendarBottomSheet>
    );
  }

  return (
    <CalendarBottomSheet
      state={state}
      title={date ? formatSheetTitle(date) : ""}
      heightClassName="h-[60dvh]"
      onClose={onClose}
      onClosed={onClosed}
    >
      {statusMessage ? (
        <p
          role={errorMessage && !isLoading ? "alert" : "status"}
          className="m-0 flex-1 py-6 text-center text-body text-muted"
        >
          {statusMessage}
        </p>
      ) : (
        <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-y-auto overscroll-contain border-t border-border p-0 pt-3">
          {events.map(({ eventId, title, color }) => (
            <li key={eventId} className="shrink-0">
              <button
                type="button"
                className="flex min-h-14 w-full cursor-pointer items-stretch gap-3 rounded-sm border-0 bg-transparent px-0 py-1 text-left transition-colors active:bg-background-subtle"
                onClick={() => onSelectEvent(eventId)}
              >
                <span
                  aria-hidden="true"
                  className="w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: getCalendarEventColorHex(color) }}
                />
                <span className="flex min-w-0 flex-col justify-center">
                  <span className="truncate text-body-lg text-foreground">{title}</span>
                  {/* TODO: 일정 목록 응답에 시간 정보가 추가되면 시작·종료 시간 또는 하루 종일 표시 */}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <ActionButton className="mt-6 shrink-0" onClick={onClose}>
        닫기
      </ActionButton>
    </CalendarBottomSheet>
  );
}
