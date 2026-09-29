// 취향 분석 데이터 부족으로 인한 새 대화 시작 안내 모달

"use client";

import Modal from "@/components/common/Modal";

type PreferenceDataInsufficientModalProps = {
  open: boolean;
  onStartNewConversation: () => void;
  isStartingConversation: boolean;
  isStartUnavailable: boolean;
  retryAfterSeconds: number;
  errorMessage: string;
};

const preventClose = () => undefined;

export default function PreferenceDataInsufficientModal({
  open,
  onStartNewConversation,
  isStartingConversation,
  isStartUnavailable,
  retryAfterSeconds,
  errorMessage,
}: PreferenceDataInsufficientModalProps) {
  const actionLabel = isStartingConversation
    ? "새로운 대화 시작 중..."
    : retryAfterSeconds > 0
      ? `${retryAfterSeconds}초 후 다시 시도`
      : "새로운 대화 시작";

  return (
    <Modal
      open={open}
      onClose={preventClose}
      title="현재 대화를 이어갈 수 없어요"
      description="취향 분석을 위한 데이터가 충분하지 않아요"
      actionsClassName="mt-8"
      secondAction={{
        label: <span className="font-bold">{actionLabel}</span>,
        onClick: onStartNewConversation,
        disabled: isStartUnavailable,
        "aria-busy": isStartingConversation || undefined,
      }}
    >
      {errorMessage && (
        <p role="alert" className="text-body-sm text-danger">
          {errorMessage}
        </p>
      )}
    </Modal>
  );
}
