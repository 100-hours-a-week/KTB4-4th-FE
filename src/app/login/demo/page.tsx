// 테스트 계정 아이디와 비밀번호를 입력하는 로그인 페이지
import Link from "next/link";

import DemoLoginForm from "@/components/auth/DemoLoginForm";
import PageIntro from "@/components/common/PageIntro";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "테스트 계정 로그인",
};

export default function DemoLoginPage() {
  return (
    <main className="page-content flex min-h-full flex-1 flex-col overflow-y-auto bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <header className="flex shrink-0 pt-6">
        <Link
          href="/login"
          className="inline-flex h-9 w-fit items-center gap-2 rounded-md bg-background-subtle px-4 text-body-sm font-bold text-foreground-secondary transition-colors hover:bg-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span aria-hidden="true">←</span>
          로그인으로 돌아가기
        </Link>
      </header>

      <div className="mt-5">
        <PageIntro
          title="테스트 계정으로 로그인해 주세요."
          description="외부 평가용으로 제공된 아이디와 비밀번호를 입력해 주세요."
        />
      </div>

      <DemoLoginForm />
    </main>
  );
}
