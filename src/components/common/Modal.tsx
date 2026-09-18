"use client";

import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";

import ChoiceButtons from "@/components/common/ChoiceButtons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  firstAction: ComponentProps<typeof ChoiceButtons>["first"];
  secondAction: ComponentProps<typeof ChoiceButtons>["second"];
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  firstAction,
  secondAction,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      data-modal
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[360px] overflow-y-auto rounded-[4px] border border-border-strong bg-surface px-4 pt-8 pb-4 text-left text-foreground shadow-lg backdrop:bg-overlay"
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
  );
}
