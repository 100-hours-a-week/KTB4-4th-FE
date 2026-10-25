// 캘린더 연월 선택과 날짜별 일정 목록에서 함께 쓰는 하단 바텀시트
"use client";

import { useId, type ReactNode } from "react";

import useDialogControl from "@/hooks/useDialogControl";

import styles from "./CalendarBottomSheet.module.css";

export type CalendarBottomSheetState = "closed" | "open" | "closing";

type CalendarBottomSheetProps = {
  state: CalendarBottomSheetState;
  title: string;
  isTitleHidden?: boolean;
  maxHeightClassName?: string;
  onClose: () => void;
  onClosed: () => void;
  children: ReactNode;
};

export default function CalendarBottomSheet({
  state,
  title,
  isTitleHidden = false,
  maxHeightClassName = "max-h-[80dvh]",
  onClose,
  onClosed,
  children,
}: CalendarBottomSheetProps) {
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
        className={`${styles.sheet} fixed inset-x-0 top-auto bottom-0 z-[60] m-0 mx-auto max-h-none w-full max-w-[var(--app-max-width)] overflow-hidden rounded-t-xl border-0 bg-surface p-0 text-foreground`}
      >
        <div
          className={`flex ${maxHeightClassName} flex-col px-page pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]`}
        >
          <h2
            id={titleId}
            className={isTitleHidden ? "sr-only" : "m-0 mb-4 shrink-0 text-heading-3 font-bold"}
          >
            {title}
          </h2>
          {state !== "closed" && <div className="flex min-h-0 flex-col">{children}</div>}
        </div>
      </dialog>
    </>
  );
}
