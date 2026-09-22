"use client";

import { useState } from "react";

import FormModal from "@/components/common/FormModal";
import { submitErrorReport, type ProblemType } from "@/lib/api/errorReports";

type ErrorFeedbackModalProps = {
  onClose: () => void;
};

const problemTypes = [
  { value: "connection", label: "연결 문제" },
  { value: "display", label: "화면 표시 문제" },
  { value: "other", label: "기타 문제" },
] satisfies { value: ProblemType; label: string }[];

export default function ErrorFeedbackModal({ onClose }: ErrorFeedbackModalProps) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [problemType, setProblemType] = useState<ProblemType | "">("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const closeModal = () => {
    setProblemType("");
    setDescription("");
    setErrorMessage("");
    onClose();
  };

  const requestClose = () => {
    if (!isSubmitting) {
      closeModal();
    }
  };

  const changeProblemType = (value: string) => {
    setProblemType(value as ProblemType);
    setErrorMessage("");
  };

  const changeDescription = (value: string) => {
    setDescription(value);
    setErrorMessage("");
  };

  const sendFeedback = async () => {
    const detail = description.trim();

    if (!problemType || !detail || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await submitErrorReport(
        {
          problemType,
          detail,
        },
        idempotencyKey,
      );
      closeModal();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "오류 피드백을 전송하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendAction = {
    label: isSubmitting ? "전송 중..." : "보내기",
    disabled: !problemType || !description.trim() || isSubmitting,
    onClick: sendFeedback,
  };

  return (
    <FormModal
      open
      onClose={requestClose}
      title="피드백 보내기"
      description="어떤 상황에서 문제가 생겼는지 알려주시면 빠르게 확인할게요."
      fields={{
        selectLabel: "어떤 문제였나요? (필수)",
        selectOptions: problemTypes,
        selectValue: problemType,
        onSelectChange: changeProblemType,
        selectPlaceholder: "문제 유형을 선택해 주세요",
        selectRequired: true,
        textareaLabel: "자세한 상황 (필수)",
        textareaValue: description,
        onTextareaChange: changeDescription,
        textareaPlaceholder: "어떤 동작을 하다가 문제가 생겼는지 적어주세요.",
        errorMessage,
      }}
      firstAction={{ label: "취소", onClick: closeModal, disabled: isSubmitting }}
      secondAction={sendAction}
    />
  );
}
