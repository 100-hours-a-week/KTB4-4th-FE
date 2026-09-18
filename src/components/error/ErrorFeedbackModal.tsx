"use client";

import { useState } from "react";

import FormModal from "@/components/common/FormModal";

export type ErrorFeedbackDetails = {
  statusCode: number;
  errorType: string;
  screenCode: string;
  appVersion: string;
};

type ErrorFeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  details: ErrorFeedbackDetails;
  occurredAt: string;
};

const problemTypes = [
  { value: "connection", label: "연결 문제" },
  { value: "display", label: "화면 표시 문제" },
  { value: "other", label: "기타 문제" },
];

export default function ErrorFeedbackModal({
  open,
  onClose,
  details,
  occurredAt,
}: ErrorFeedbackModalProps) {
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");

  const closeModal = () => {
    setProblemType("");
    setDescription("");
    onClose();
  };

  const information = [
    { label: "오류 코드", value: `ERROR ${details.statusCode}` },
    { label: "오류 유형", value: details.errorType },
    { label: "발생 화면", value: details.screenCode },
    { label: "발생 시각", value: occurredAt },
    { label: "앱 버전", value: details.appVersion },
  ];

  // TODO: 전송 API와 보내기 클릭 동작이 정해지면 버튼을 활성화한다.
  const sendAction = { label: "보내기", disabled: true };

  return (
    <FormModal
      open={open}
      onClose={closeModal}
      title="피드백 보내기"
      description="어떤 상황에서 문제가 생겼는지 알려주시면 빠르게 확인할게요."
      beforeFields={
        <section className="mb-5 bg-background-subtle p-3 text-sm">
          <h3 className="font-bold">자동으로 함께 전송되는 정보</h3>
          <dl className="mt-2 space-y-2">
            {information.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className="min-w-0 text-right font-semibold break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      }
      fields={{
        selectLabel: "어떤 문제였나요? (필수)",
        selectOptions: problemTypes,
        selectValue: problemType,
        onSelectChange: setProblemType,
        selectPlaceholder: "문제 유형을 선택해 주세요",
        selectRequired: true,
        textareaLabel: "자세한 상황",
        textareaValue: description,
        onTextareaChange: setDescription,
        textareaPlaceholder: "어떤 동작을 하다가 문제가 생겼는지 적어주세요.",
      }}
      firstAction={{ label: "취소", onClick: closeModal }}
      secondAction={sendAction}
    />
  );
}
