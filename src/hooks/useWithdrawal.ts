// 이 기기의 알림 연결·웹 푸시 구독 정리 후 회원 탈퇴 API를 호출하고 로그인 페이지로 이동하는 훅
"use client";

import { useRef, useState } from "react";

import { ApiRequestError } from "@/lib/api/client";
import { withdraw } from "@/lib/api/withdrawal";
import { cleanupBeforeSessionEnd } from "@/lib/auth/session";
import { clearWebPushRestoreUserId } from "@/lib/webPushRestore";

const LOGIN_PATH = "/login";
const WITHDRAWAL_FAILED_MESSAGE = "회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const getWithdrawalErrorMessage = (error: unknown) => {
  // 네트워크 오류 등 브라우저 기본 에러 메시지는 노출하지 않고 기본 안내 문구를 표시함
  if (!(error instanceof ApiRequestError)) return WITHDRAWAL_FAILED_MESSAGE;

  if (error.status === 429 && error.retryAfterSeconds !== undefined) {
    return `${error.message} ${error.retryAfterSeconds}초 후 다시 시도해 주세요.`;
  }

  return error.message;
};

export default function useWithdrawal() {
  const isPendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  // 409는 다른 요청에서 탈퇴가 진행 중이므로 이 화면에 머무는 동안 다시 요청하지 않음
  const [isBlocked, setIsBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 탈퇴 API가 실패하면 현재 화면에 남고, 이미 정리한 알림 연결과 웹 푸시 구독은 복구하지 않음
  // 성공 시 전체 페이지 이동으로 CSRF 토큰 캐시와 Context 상태까지 초기화함
  const withdrawAndRedirect = async () => {
    if (isPendingRef.current || isBlocked) return;

    isPendingRef.current = true;
    setIsPending(true);
    setErrorMessage("");

    try {
      await cleanupBeforeSessionEnd();
      await withdraw();
      // 탈퇴한 사용자가 이전 로그아웃 때 남긴 웹 푸시 복원 대상이 다시 사용되지 않도록 삭제함
      clearWebPushRestoreUserId();
      window.location.replace(LOGIN_PATH);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        window.location.replace(LOGIN_PATH);
        return;
      }

      if (error instanceof ApiRequestError && error.status === 409) {
        setIsBlocked(true);
      }

      setErrorMessage(getWithdrawalErrorMessage(error));
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  // 409 안내 문구는 모달을 다시 열었을 때 버튼이 비활성화된 이유를 알 수 있도록 유지함
  const resetError = () => {
    if (isBlocked) return;

    setErrorMessage("");
  };

  return { isPending, isBlocked, errorMessage, withdraw: withdrawAndRedirect, resetError };
}
