// 캘린더 연월 선택·날짜별 일정 목록·일정 추가에서 함께 쓰는 바텀시트
"use client";

import { useId, type ReactNode } from "react";

import useDialogControl from "@/hooks/useDialogControl";

import styles from "./CalendarBottomSheet.module.css";

export type CalendarBottomSheetState = "closed" | "open" | "closing";

type CalendarBottomSheetProps = {
  state: CalendarBottomSheetState;
  title: string;
  isTitleHidden?: boolean;
  heightClassName?: string;
  isCenteredModal?: boolean;
  headerStart?: ReactNode;
  headerEnd?: ReactNode;
  onClose: () => void;
  onClosed: () => void;
  children: ReactNode;
};

export default function CalendarBottomSheet({
  state,
  title,
  isTitleHidden = false,
  heightClassName = "max-h-[80dvh]",
  isCenteredModal = false,
  headerStart,
  headerEnd,
  onClose,
  onClosed,
  children,
}: CalendarBottomSheetProps) {
  const dialogRef = useDialogControl({ open: state !== "closed" });
  const titleId = useId();
  const hasHeader = headerStart !== undefined || headerEnd !== undefined;

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
          if (event.target !== event.currentTarget) return;

          event.preventDefault();
          onClose();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        onClose={(event) => {
          if (event.target === event.currentTarget && state !== "closed") onClosed();
        }}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && state === "closing") onClosed();
        }}
        className={
          isCenteredModal
            ? `${styles.modal} fixed inset-0 z-[60] m-auto h-fit select-none max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[360px] overflow-hidden rounded-md border border-border-strong bg-surface p-0 text-foreground shadow-lg`
            : `${styles.sheet} fixed inset-x-0 top-auto bottom-0 z-[60] m-0 mx-auto max-h-none w-full max-w-[var(--app-max-width)] overflow-hidden rounded-t-xl border-0 bg-surface p-0 text-foreground`
        }
      >
        <div
          className={`flex flex-col ${
            isCenteredModal
              ? "max-h-[calc(100dvh-2rem)] px-4 pt-2 pb-4"
              : `${heightClassName} ${hasHeader ? "pt-2" : "pt-6"} px-page pb-[max(1rem,env(safe-area-inset-bottom))]`
          }`}
        >
          {hasHeader && (
            <div className="-mx-2 mb-2 flex shrink-0 items-center justify-between">
              <div className="flex items-center">{headerStart}</div>
              <div className="flex items-center">{headerEnd}</div>
            </div>
          )}
          <h2
            id={titleId}
            className={isTitleHidden ? "sr-only" : "m-0 mb-4 shrink-0 text-heading-3 font-bold"}
          >
            {title}
          </h2>
          {state !== "closed" && <div className="flex min-h-0 flex-1 flex-col">{children}</div>}
        </div>
      </dialog>
    </>
  );
}
