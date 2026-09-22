// AI 취향 분석 진행 중 상태를 안내하는 로딩 모달

"use client";

import { useId } from "react";

import useDialogControl from "@/hooks/useDialogControl";

import styles from "./PreferenceAnalysisLoadingModal.module.css";

type PreferenceAnalysisLoadingModalProps = {
  open: boolean;
};

export default function PreferenceAnalysisLoadingModal({
  open,
}: PreferenceAnalysisLoadingModalProps) {
  const dialogRef = useDialogControl({ open, mode: "non-modal" });
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      {open && <div aria-hidden="true" className={styles.overlay} />}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy="true"
        className={styles.dialog}
      >
        <div className={styles.spinnerArea}>
          <div aria-hidden="true" className={styles.spinner} />
        </div>

        <h2 id={titleId} className={styles.title}>
          취향을 분석하고 있어요
        </h2>
        <p id={descriptionId} className={styles.description}>
          니쥬와의 대화에서 취향을 정리하는 중이에요.
          <br />
          잠시만 기다려주세요.
        </p>
      </dialog>
    </>
  );
}
