// 만료된 AI 대화와 새 대화방 생성을 안내하는 모달

"use client";

import ActionButton from "@/components/common/ActionButton";
import Modal from "@/components/common/Modal";

type AiConversationExpiredModalProps = {
  open: boolean;
  onStartNewConversation: () => void;
  isStartingConversation: boolean;
  isStartUnavailable: boolean;
  retryAfterSeconds: number;
  errorMessage: string;
};

const preventClose = () => undefined;

export default function AiConversationExpiredModal({
  open,
  onStartNewConversation,
  isStartingConversation,
  isStartUnavailable,
  retryAfterSeconds,
  errorMessage,
}: AiConversationExpiredModalProps) {
  const actionLabel =
    retryAfterSeconds > 0 ? `${retryAfterSeconds}초 후 다시 시도` : "새 대화방 생성";

  return (
    <Modal
      open={open}
      onClose={preventClose}
      title="AI 대화 서버가 만료되었습니다."
      actionsClassName="mt-8"
      actions={
        <ActionButton
          onClick={onStartNewConversation}
          isLoading={isStartingConversation}
          loadingText="새 대화방 생성 중..."
          disabled={isStartUnavailable}
          className="font-bold"
        >
          {actionLabel}
        </ActionButton>
      }
    >
      {errorMessage && (
        <p role="alert" className="text-body-sm text-danger">
          {errorMessage}
        </p>
      )}
    </Modal>
  );
}
