// 제목과 설명 및 선택지 버튼을 제공하는 공통 모달 컴포넌트

"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

import ChoiceButtons from "@/components/common/ChoiceButtons";
import useDialogControl from "@/hooks/useDialogControl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  titleClassName?: string;
  description?: string;
  children?: ReactNode;
  childrenClassName?: string;
  firstAction?: ComponentProps<typeof ChoiceButtons>["first"];
  secondAction?: ComponentProps<typeof ChoiceButtons>["second"];
  actions?: ReactNode;
  actionsClassName?: string;
  keepHeaderInteractive?: boolean;
  // 제목 오른쪽에 모달을 닫는 X 버튼을 표시함
  showCloseButton?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  titleClassName = "",
  description,
  children,
  childrenClassName = "mt-8",
  firstAction,
  secondAction,
  actions,
  actionsClassName = "mt-4",
  keepHeaderInteractive = false,
  showCloseButton = false,
}: ModalProps) {
  const dialogRef = useDialogControl({
    open,
    mode: keepHeaderInteractive ? "non-modal" : "modal",
  });
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      {open && (
        <div
          aria-hidden="true"
          className={`fixed bottom-0 left-1/2 z-50 w-full max-w-[var(--app-max-width)] -translate-x-1/2 bg-overlay ${
            keepHeaderInteractive ? "top-[60px] pointer-events-auto" : "top-0 pointer-events-none"
          }`}
        />
      )}
      <dialog
        ref={dialogRef}
        data-modal
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        className={`fixed right-0 bottom-0 left-0 z-[60] m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[360px] overflow-y-auto rounded-[4px] border border-border-strong bg-surface px-4 pt-8 pb-4 text-left text-foreground shadow-lg ${
          keepHeaderInteractive ? "top-[60px]" : "top-0"
        }`}
      >
        {showCloseButton && (
          <button
            type="button"
            aria-label="닫기"
            className="touch-target absolute top-4 right-2 flex items-center justify-center border-0 bg-transparent p-0 text-foreground"
            onClick={onClose}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        <h2
          id={titleId}
          className={`text-xl font-bold ${showCloseButton ? "pr-10" : ""} ${titleClassName}`}
        >
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-2 text-xs text-foreground-secondary">
            {description}
          </p>
        )}

        {children && <div className={childrenClassName}>{children}</div>}

        {actions ? (
          <div className={actionsClassName}>{actions}</div>
        ) : (
          secondAction && (
            <ChoiceButtons first={firstAction} second={secondAction} className={actionsClassName} />
          )
        )}
      </dialog>
    </>
  );
}
