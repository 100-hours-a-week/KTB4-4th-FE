"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

import ChoiceButtons from "@/components/common/ChoiceButtons";
import useDialogControl from "@/hooks/useDialogControl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  firstAction: ComponentProps<typeof ChoiceButtons>["first"];
  secondAction: ComponentProps<typeof ChoiceButtons>["second"];
  keepHeaderInteractive?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  firstAction,
  secondAction,
  keepHeaderInteractive = false,
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
        <h2 id={titleId} className="text-xl font-bold">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-2 text-xs text-foreground-secondary">
            {description}
          </p>
        )}

        {children && <div className="mt-8">{children}</div>}

        <ChoiceButtons first={firstAction} second={secondAction} className="mt-4" />
      </dialog>
    </>
  );
}
