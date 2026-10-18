// 공통 에러 안내 화면

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ErrorPageButton from "@/components/common/ErrorPageButton";
import ErrorFeedbackModal from "@/components/error/ErrorFeedbackModal";
import Header from "@/components/layout/Header";

type ErrorPageProps = {
  title: string;
  description: string;
  showHeader?: boolean;
};

export default function ErrorPage({ title, description, showHeader = true }: ErrorPageProps) {
  const router = useRouter();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const closeFeedbackModal = () => setIsFeedbackModalOpen(false);
  const openFeedbackModal = () => setIsFeedbackModalOpen(true);

  return (
    <>
      {showHeader && <Header />}
      <main className="page-content flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#ededed] text-center text-foreground">
        <div className="my-auto w-full pt-8 pb-[calc(2rem+12vh)]">
          <h1 className="text-[clamp(22px,5vw,28px)] leading-tight font-bold">{title}</h1>
          <p className="mt-1 text-base leading-normal text-[#4684e9]">{description}</p>

          <Image
            src="/images/needu_troubled_transparent.webp"
            alt="문제가 발생해 걱정하는 니쥬 캐릭터"
            width={200}
            height={174}
            className="mx-auto mt-8 h-auto w-[200px]"
          />

          <div className="mt-4 flex justify-center">
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
      {isFeedbackModalOpen && <ErrorFeedbackModal onClose={closeFeedbackModal} />}
    </>
  );
}
