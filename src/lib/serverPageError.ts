// 서버 페이지 API 오류를 상태에 맞는 화면으로 연결하는 공통 처리 함수
import "server-only";

import { notFound, redirect } from "next/navigation";

import { ServerApiError } from "@/lib/api/serverClient";

type ServerPageErrorOptions = {
  notFoundStatuses?: readonly number[];
};

export function handleServerPageError(
  error: unknown,
  { notFoundStatuses = [] }: ServerPageErrorOptions = {},
): never {
  if (error instanceof ServerApiError) {
    if (error.status === 401) {
      redirect("/login");
    }

    if (notFoundStatuses.includes(error.status)) {
      notFound();
    }
  }

  redirect("/error");
}
