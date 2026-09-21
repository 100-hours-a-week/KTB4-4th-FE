// 보호 페이지 진입 시 로그인 유효성을 확인하는 인증 Guard
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiRequestError } from "@/lib/api/client";
import { checkLoginValidity } from "@/lib/api/loginValidity";

import type { ReactNode } from "react";

interface LoginValidityGuardProps {
  children: ReactNode;
}

export default function LoginValidityGuard({ children }: LoginValidityGuardProps) {
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let isActive = true;

    checkLoginValidity()
      .then(() => {
        if (isActive) {
          setIsValid(true);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) return;

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        if (error instanceof ApiRequestError && error.status === 429) {
          // TODO: 추후 로그인 유효성 확인 API의 429 응답 구현 시 retryAfterSeconds 기반 재시도 처리를 추가합니다.
        }

        router.replace("/error");
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  if (!isValid) return null;

  return children;
}
