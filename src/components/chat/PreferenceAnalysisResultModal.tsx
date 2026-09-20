// AI 취향 분석 결과와 사용자 확인 선택지를 표시하는 모달

"use client";

import Modal from "@/components/common/Modal";
import type { PreferenceAnalysisResult } from "@/types/chat";

import styles from "./PreferenceAnalysisResultModal.module.css";

type PreferenceAnalysisResultModalProps = {
  open: boolean;
  result: PreferenceAnalysisResult;
  onReject: () => void;
  onConfirm: () => void;
};

export default function PreferenceAnalysisResultModal({
  open,
  result,
  onReject,
  onConfirm,
}: PreferenceAnalysisResultModalProps) {
  return (
    <div className={styles.scope}>
      <Modal
        open={open}
        onClose={onReject}
        title="이렇게 기억하려 해요"
        keepHeaderInteractive
        firstAction={{ label: "틀려요", onClick: onReject }}
        secondAction={{ label: "맞아요", onClick: onConfirm }}
      >
        <p className="mt-0 text-body-sm text-foreground">
          니쥬가 분석한 내용이 맞다고 생각하시나요?
        </p>
        <div aria-label="취향 분석 결과" className="mt-6 flex flex-wrap gap-1">
          {result.badges.map((badge) => (
            <span
              key={badge}
              className="whitespace-nowrap rounded-full bg-info-subtle px-2 py-1 text-[10px] font-bold text-muted"
            >
              {badge}
            </span>
          ))}
        </div>
      </Modal>
    </div>
  );
}
