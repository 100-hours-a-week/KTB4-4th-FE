// 회원 탈퇴 시 삭제되는 데이터와 최종 확인 동작을 안내하는 모달

"use client";

import ActionButton from "@/components/common/ActionButton";
import Modal from "@/components/common/Modal";

type WithdrawalModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const deletedDataItems = [
  "회원 계정 정보",
  "프로필 정보",
  "취향 정보",
  "친구 목록",
  "선물 추천 기록",
  "알림 내역",
  "서비스 이용 중 생성된 사용자 관련 데이터",
];

export default function WithdrawalModal({ open, onClose, onConfirm }: WithdrawalModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="알림"
      titleClassName="text-center"
      actionsClassName="mt-7"
      actions={
        <div className="flex w-full gap-3">
          <ActionButton
            className="!bg-disabled !text-background"
            aria-label="회원 탈퇴 확정"
            onClick={onConfirm}
          >
            탈퇴하기
          </ActionButton>
          <ActionButton className="!bg-foreground !text-background" onClick={onClose}>
            취소
          </ActionButton>
        </div>
      }
    >
      <div className="text-body-sm text-foreground">
        <p className="m-0">탈퇴하면 아래 데이터가 즉시 삭제됩니다..!</p>

        <ul className="mt-5 mb-0 list-disc space-y-1 pl-5">
          {deletedDataItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="mt-6 space-y-1">
          <p className="m-0">삭제된 데이터는 복구할 수 없어요.</p>
        </div>
      </div>
    </Modal>
  );
}
