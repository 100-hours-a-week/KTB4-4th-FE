// 캘린더 일정 삭제 전 한 번 더 확인하는 모달
"use client";

import Modal from "@/components/common/Modal";

type CalendarEventDeleteModalProps = {
  open: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CalendarEventDeleteModal({
  open,
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}: CalendarEventDeleteModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      title="일정을 삭제할까요?"
      description="삭제한 일정은 되돌릴 수 없어요."
      childrenClassName="mt-3"
      actionsClassName="mt-6"
      firstAction={{ label: "취소", disabled: isDeleting, onClick: onClose }}
      secondAction={{
        label: isDeleting ? "삭제 중" : "삭제",
        disabled: isDeleting,
        "aria-busy": isDeleting,
        onClick: onConfirm,
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
