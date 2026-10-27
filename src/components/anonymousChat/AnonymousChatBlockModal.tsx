// 익명 채팅 상대를 차단하기 전 한 번 더 확인하고 차단을 요청하는 모달
"use client";

import { useState } from "react";

import Modal from "@/components/common/Modal";
import { blockAnonymousChatUser } from "@/lib/api/anonymousChatModeration";

type AnonymousChatBlockModalProps = {
  open: boolean;
  chatId: number;
  onClose: () => void;
  onBlocked: () => void;
};

export default function AnonymousChatBlockModal({
  open,
  chatId,
  onClose,
  onBlocked,
}: AnonymousChatBlockModalProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (isBlocking) return;

    setErrorMessage(null);
    onClose();
  };

  const handleConfirm = async () => {
    setIsBlocking(true);
    setErrorMessage(null);

    try {
      await blockAnonymousChatUser(chatId);
      onBlocked();
    } catch {
      setErrorMessage("차단하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="해당 사용자를 차단하시겠습니까?"
      description="차단하면 이 사용자와 더 이상 대화할 수 없어요."
      childrenClassName="mt-3"
      actionsClassName="mt-10"
      firstAction={{ label: "취소", disabled: isBlocking, onClick: handleClose }}
      secondAction={{
        label: isBlocking ? "차단 중" : "차단하기",
        disabled: isBlocking,
        "aria-busy": isBlocking,
        onClick: () => void handleConfirm(),
      }}
    >
      {errorMessage && (
        <p role="alert" className="m-0 text-body-sm text-danger">
          {errorMessage}
        </p>
      )}
    </Modal>
  );
}
