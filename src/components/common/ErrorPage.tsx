"use client";

import { useRouter } from "next/navigation";

import ErrorPageButton from "@/components/common/ErrorPageButton";
import Header from "@/components/layout/Header";

type ErrorPageProps = {
  title: string;
  description: string;
};

export default function ErrorPage({ title, description }: ErrorPageProps) {
  const router = useRouter();

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

          <p className="mt-5 text-sm">
            <span className="text-foreground-secondary">문제가 계속되나요?</span> 피드백 보내기
          </p>
        </div>
      </main>
    </>
  );
}
