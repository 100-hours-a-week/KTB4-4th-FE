// 루트 레이아웃 오류 수집 및 복구 화면
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { KAKAO_SMALL_SANS_STYLESHEET } from "./fonts";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <head>
        {/* 클라이언트에서 렌더링될 수 있어 인라인 스크립트 대신 일반 stylesheet로 폰트 정의 연결 */}
        <link rel="stylesheet" href={KAKAO_SMALL_SANS_STYLESHEET} />
      </head>
      <body>
        <main className="mobile-layout page-content items-center justify-center text-center">
          <h1 className="text-heading-2 font-bold text-foreground">문제가 발생했어요.</h1>
          <p className="mt-2 text-body-lg text-foreground-secondary">잠시 후 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 cursor-pointer rounded-sm border-0 bg-primary px-5 text-body-lg font-bold text-on-primary"
          >
            다시 시도하기
          </button>
        </main>
      </body>
    </html>
  );
}
