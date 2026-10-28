// 익명 채팅방을 나가기 전 한 번 더 확인하고 나가기를 요청하는 모달
"use client";

import { useState } from "react";

import Modal from "@/components/common/Modal";
import { leaveAnonymousChat } from "@/lib/api/anonymousChats";

type AnonymousChatLeaveModalProps = {
  chatId: number | null;
  onClose: () => void;
  onLeft: (chatId: number) => void;
};

export default function AnonymousChatLeaveModal({
  chatId,
  onClose,
  onLeft,
}: AnonymousChatLeaveModalProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (isLeaving) return;

    setErrorMessage(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (chatId === null) return;

    setIsLeaving(true);
    setErrorMessage(null);

    try {
      await leaveAnonymousChat(chatId);
      onLeft(chatId);
    } catch {
      setErrorMessage("채팅방을 나가지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Modal
      open={chatId !== null}
      onClose={handleClose}
      title="채팅방을 나가시겠습니까?"
      description="나가면 대화 내용을 다시 볼 수 없어요."
      childrenClassName="mt-3"
      actionsClassName="mt-10"
      firstAction={{ label: "취소", disabled: isLeaving, onClick: handleClose }}
      secondAction={{
        label: isLeaving ? "나가는 중" : "나가기",
        disabled: isLeaving,
        "aria-busy": isLeaving,
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
