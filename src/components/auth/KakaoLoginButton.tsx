// 카카오 OAuth 인증 화면으로 이동하는 로그인 버튼
"use client";

import Image from "next/image";

import { API_ENDPOINTS } from "@/lib/api/endpoints";

export default function KakaoLoginButton() {
  const handleLogin = () => {
    const authorizeUrl = new URL(API_ENDPOINTS.auth.kakaoAuthorize, window.location.origin);
    const returnUrl = new URL("/", window.location.origin);

    authorizeUrl.searchParams.set("returnUrl", returnUrl.toString());
    window.location.assign(authorizeUrl.toString());
  };

  return (
    <button
      type="button"
      aria-label="카카오로 로그인"
      className="mt-3 block w-full max-w-[332px] self-center border-0 bg-transparent p-0"
      onClick={handleLogin}
    >
      <Image
        src="/images/kakao_login_large_wide.png"
        alt="카카오 로그인"
        width={600}
        height={90}
        className="h-auto w-full"
        priority
      />
    </button>
  );
}
