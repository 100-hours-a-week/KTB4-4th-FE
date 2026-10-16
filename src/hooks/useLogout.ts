// 이 기기의 알림 연결·웹 푸시 구독 정리 후 로그아웃 API를 호출하고 로그인 페이지로 이동하는 훅
"use client";

import { useRef, useState } from "react";

import { useToastContext } from "@/contexts/ToastContext";
import { logout } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { cleanupBeforeSessionEnd } from "@/lib/auth/session";
import { rememberWebPushForRestore } from "@/lib/webPushRestore";

const LOGIN_PATH = "/login";
const LOGOUT_FAILED_MESSAGE = "로그아웃하지 못했습니다.";

export default function useLogout() {
  const { showToast } = useToastContext();
  const isPendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  // 로그아웃 API가 실패하면 현재 화면에 남고, 이미 정리한 알림 연결과 웹 푸시 구독은 복구하지 않음
  // 성공 시 전체 페이지 이동으로 CSRF 토큰 캐시와 Context 상태까지 초기화함
  // 호출한 화면에서 실패 후 처리(사이드바 닫기 등)를 할 수 있도록 성공 여부를 반환함
  const logoutAndRedirect = async () => {
    if (isPendingRef.current) return false;

    isPendingRef.current = true;
    setIsPending(true);

    try {
      // 정리 단계에서 구독이 해제되므로 그 전에 재로그인 시 복원할 사용자를 저장함
      await rememberWebPushForRestore();
      await cleanupBeforeSessionEnd();
      await logout();
      window.location.replace(LOGIN_PATH);
      return true;
    } catch (error) {
      // 네트워크 오류 등 브라우저 기본 에러 메시지는 노출하지 않고 기본 안내 문구를 표시함
      showToast(error instanceof ApiRequestError ? error.message : LOGOUT_FAILED_MESSAGE);
      isPendingRef.current = false;
      setIsPending(false);
      return false;
    }
  };

  return { isPending, logout: logoutAndRedirect };
}
