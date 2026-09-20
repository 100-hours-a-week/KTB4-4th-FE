// AI 취향 분석 지연 상태와 후속 선택지를 안내하는 모달

"use client";

import Modal from "@/components/common/Modal";

import styles from "./PreferenceAnalysisTimeoutModal.module.css";

type PreferenceAnalysisTimeoutModalProps = {
  open: boolean;
  onReturnToChat: () => void;
  onRetryAnalysis: () => void;
};

export default function PreferenceAnalysisTimeoutModal({
  open,
  onReturnToChat,
  onRetryAnalysis,
}: PreferenceAnalysisTimeoutModalProps) {
  return (
    <div className={styles.scope}>
      <Modal
        open={open}
        onClose={onReturnToChat}
        title="분석이 예상보다 오래 걸리고 있어요"
        description="잠시 후 다시 확인하거나 분석 상태를 다시 조회해 주세요."
        firstAction={{ label: "대화로 돌아가기", onClick: onReturnToChat }}
        secondAction={{ label: "다시 분석 요청", onClick: onRetryAnalysis }}
      />
    </div>
  );
}
