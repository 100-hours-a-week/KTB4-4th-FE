"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ErrorPageButton from "@/components/common/ErrorPageButton";
import ErrorFeedbackModal, {
  type ErrorFeedbackDetails,
} from "@/components/error/ErrorFeedbackModal";
import Header from "@/components/layout/Header";

type ErrorPageProps = {
  title: string;
  description: string;
  feedbackDetails: ErrorFeedbackDetails;
};

function formatOccurredAt(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

export default function ErrorPage({ title, description, feedbackDetails }: ErrorPageProps) {
  const router = useRouter();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [occurredAt, setOccurredAt] = useState("");

  const closeFeedbackModal = () => setIsFeedbackModalOpen(false);
  const openFeedbackModal = () => {
    setOccurredAt(formatOccurredAt(new Date()));
    setIsFeedbackModalOpen(true);
  };

  return (
    <>
      <Header />
      <main className="page-content flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#ededed] text-center text-foreground">
        <div className="my-auto w-full pt-8 pb-[calc(2rem+12vh)]">
          <h1 className="text-[clamp(22px,5vw,28px)] leading-tight font-bold">{title}</h1>
          <p className="mt-1 text-base leading-normal text-[#4684e9]">{description}</p>

          <div className="mt-8 flex justify-center">
            <ErrorPageButton onClick={() => router.push("/")}>다시 홈으로 돌아가기</ErrorPageButton>
          </div>

          <p className="mt-5 flex items-center justify-center text-sm">
            <span className="text-foreground-secondary">문제가 계속되나요?</span>
            <button
              type="button"
              onClick={openFeedbackModal}
              className="ml-1 cursor-pointer border-0 bg-transparent p-0 text-foreground"
            >
              피드백 보내기
            </button>
          </p>
        </div>
      </main>
      <ErrorFeedbackModal
        open={isFeedbackModalOpen}
        onClose={closeFeedbackModal}
        details={feedbackDetails}
        occurredAt={occurredAt}
      />
    </>
  );
}
