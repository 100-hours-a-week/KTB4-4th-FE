// 익명 채팅 상대의 신고 사유와 상세 내용을 입력받아 신고를 요청하는 모달
"use client";

import { useId, useState } from "react";

import Modal from "@/components/common/Modal";
import {
  ANONYMOUS_CHAT_REPORT_DESCRIPTION_MAX_LENGTH,
  reportAnonymousChatUser,
  type AnonymousChatReportReason,
} from "@/lib/api/anonymousChatModeration";
import { ApiRequestError } from "@/lib/api/client";

type AnonymousChatReportModalProps = {
  open: boolean;
  chatId: number;
  onClose: () => void;
  onReported: (message?: string) => void;
};

const REPORT_REASON_OPTIONS: { value: AnonymousChatReportReason; label: string }[] = [
  { value: "ABUSE", label: "욕설·비하" },
  { value: "SEXUAL", label: "성적인 발언" },
  { value: "SPAM", label: "광고·도배" },
  { value: "PERSONAL_INFO", label: "개인정보 요구·노출" },
  { value: "OTHER", label: "기타" },
];

export default function AnonymousChatReportModal({
  open,
  chatId,
  onClose,
  onReported,
}: AnonymousChatReportModalProps) {
  const [reason, setReason] = useState<AnonymousChatReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reasonLegendId = useId();
  const descriptionId = useId();
  const descriptionHintId = useId();
  const isDescriptionRequired = reason === "OTHER";
  const trimmedDescription = description.trim();
  const isSubmitDisabled =
    reason === null || (isDescriptionRequired && !trimmedDescription) || isSubmitting;

  const resetForm = () => {
    setReason(null);
    setDescription("");
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;

    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (reason === null || isSubmitDisabled) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await reportAnonymousChatUser(chatId, {
        reason,
        description: trimmedDescription || undefined,
      });
      resetForm();
      onReported();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        resetForm();
        onReported(error.message);
        return;
      }

      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="신고하기"
      description="신고 사유를 선택해주세요."
      showCloseButton
      childrenClassName="mt-5"
      actionsClassName="mt-6"
      firstAction={{ label: "취소", disabled: isSubmitting, onClick: handleClose }}
      secondAction={{
        label: isSubmitting ? "신고 중" : "신고하기",
        disabled: isSubmitDisabled,
        "aria-busy": isSubmitting,
        onClick: () => void handleSubmit(),
      }}
    >
      <fieldset aria-labelledby={reasonLegendId} className="m-0 border-0 p-0">
        <legend id={reasonLegendId} className="p-0 text-body-sm font-bold text-foreground">
          어떤 문제였나요? (필수)
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPORT_REASON_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="cursor-pointer rounded-full border border-border-strong bg-surface px-3.5 py-2 text-body-sm text-foreground transition-colors has-checked:border-primary has-checked:bg-primary has-checked:font-bold has-checked:text-on-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground"
            >
              <input
                type="radio"
                name={`report-reason-${chatId}`}
                value={value}
                checked={reason === value}
                disabled={isSubmitting}
                onChange={() => setReason(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor={descriptionId} className="text-body-sm font-bold text-foreground">
          상세 내용 {isDescriptionRequired ? "(필수)" : "(선택)"}
        </label>
        <textarea
          id={descriptionId}
          value={description}
          maxLength={ANONYMOUS_CHAT_REPORT_DESCRIPTION_MAX_LENGTH}
          disabled={isSubmitting}
          required={isDescriptionRequired}
          placeholder={
            isDescriptionRequired
              ? "기타 사유를 입력해 주세요."
              : "신고 내용을 자세히 알려주시면 확인에 도움이 돼요."
          }
          aria-describedby={descriptionHintId}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 block h-24 w-full resize-none rounded-sm border border-border-strong bg-surface p-3 text-foreground placeholder:text-muted"
        />
        <p id={descriptionHintId} className="mt-1 text-right text-caption text-muted">
          {description.length} / {ANONYMOUS_CHAT_REPORT_DESCRIPTION_MAX_LENGTH}
        </p>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-2 text-body-sm text-danger">
          {errorMessage}
        </p>
      )}
    </Modal>
  );
}
