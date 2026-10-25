// 캘린더에서 선택한 날짜의 일정 목록을 보여주는 바텀시트
"use client";

import ActionButton from "@/components/common/ActionButton";
import CalendarBottomSheet, {
  type CalendarBottomSheetState,
} from "@/components/home/CalendarBottomSheet";
import { getCalendarEventColorHex } from "@/lib/calendarEventColors";
import type { CalendarEventListItem } from "@/types/calendar";

type CalendarEventListSheetProps = {
  state: CalendarBottomSheetState;
  date: Date | null;
  events: CalendarEventListItem[];
  isLoading: boolean;
  errorMessage: string | null;
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
  onClose,
  onClosed,
}: CalendarEventListSheetProps) {
  const statusMessage = isLoading ? "일정을 불러오는 중입니다." : errorMessage;

  return (
    <CalendarBottomSheet
      state={state}
      title={date ? formatSheetTitle(date) : ""}
      maxHeightClassName="max-h-[60dvh]"
      onClose={onClose}
      onClosed={onClosed}
    >
      {statusMessage ? (
        <p
          role={errorMessage && !isLoading ? "alert" : "status"}
          className="m-0 shrink-0 py-6 text-center text-body text-muted"
        >
          {statusMessage}
        </p>
      ) : (
        <ul className="m-0 flex min-h-0 list-none flex-col gap-1 overflow-y-auto overscroll-contain border-t border-border p-0 pt-3">
          {events.map(({ eventId, title, color }) => (
            // TODO: 일정 클릭 시 일정 상세 조회 연결
            <li key={eventId} className="flex min-h-14 shrink-0 items-stretch gap-3 py-1">
              <span
                aria-hidden="true"
                className="w-1 shrink-0 rounded-full"
                style={{ backgroundColor: getCalendarEventColorHex(color) }}
              />
              <div className="flex min-w-0 flex-col justify-center">
                <p className="m-0 truncate text-body-lg text-foreground">{title}</p>
                {/* TODO: 일정 목록 응답에 시간 정보가 추가되면 시작·종료 시간 또는 하루 종일 표시 */}
              </div>
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
