// 카카오 로그인과 테스트 계정 로그인을 제공하는 로그인 페이지
import Image from "next/image";
import Link from "next/link";

import KakaoLoginButton from "@/components/auth/KakaoLoginButton";

import styles from "./LoginPage.module.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  // 루트의 기본 noindex를 덮어써 검색 노출 허용
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <main className="page-content flex min-h-0 flex-1 flex-col overflow-y-auto bg-background pt-[88px] pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <div className="mt-12 flex h-[340px] w-full shrink-0 flex-col items-center justify-center">
        <Image
          src="/images/NeedU_logo.png"
          alt="NeedU 서비스 로고"
          width={1005}
          height={261}
          sizes="(max-width: 430px) 100vw, 430px"
          className={`${styles.logoReveal} h-auto w-[80%] object-contain`}
          priority
        />
        <p className="mt-8 text-center text-body-sm leading-normal font-medium">
          대화를 통해 취향을 발견하고 선물을 찾아보세요.
        </p>
      </div>

      <KakaoLoginButton />

      <Link
        href="/login/demo"
        className="mt-3 self-center px-3 py-2 text-caption font-medium text-muted underline decoration-muted decoration-1 underline-offset-4 transition-colors hover:text-foreground-secondary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground-secondary"
      >
        테스트 계정으로 로그인하기
      </Link>
    </main>
  );
}
