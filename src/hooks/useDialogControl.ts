// dialog 요소의 표시 방식과 열림 상태를 동기화하는 공통 훅

"use client";

import { useEffect, useRef } from "react";

type DialogDisplayMode = "modal" | "non-modal";

type UseDialogControlOptions = {
  open: boolean;
  mode?: DialogDisplayMode;
};

export default function useDialogControl({ open, mode = "modal" }: UseDialogControlOptions) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogState = open ? mode : "closed";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (dialogState !== "closed" && !dialog.open) {
      if (dialogState === "non-modal") {
        dialog.show();
      } else {
        dialog.showModal();
      }
    }

    if (dialogState === "closed" && dialog.open) dialog.close();
  }, [dialogState]);

  return dialogRef;
}
