// 카카오 친구 연동 인증 화면으로 이동하는 버튼
"use client";

import ActionButton from "@/components/common/ActionButton";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

type KakaoFriendConnectButtonProps = {
  variant?: "connect" | "sync";
};

export default function KakaoFriendConnectButton({
  variant = "connect",
}: KakaoFriendConnectButtonProps) {
  const handleConnect = () => {
    const authorizeUrl = new URL(API_ENDPOINTS.friends.kakaoAuthorize, window.location.origin);
    const returnUrl = new URL("/friends", window.location.origin);

    authorizeUrl.searchParams.set("returnUrl", returnUrl.toString());
    window.location.assign(authorizeUrl.toString());
  };

  if (variant === "sync") {
    return (
      <button
        type="button"
        aria-label="카카오 친구 동기화"
        className="flex cursor-pointer items-center border-0 bg-transparent p-0 text-foreground-secondary"
        onClick={handleConnect}
      >
        <span className="rounded-sm bg-background-subtle px-2 py-1 font-bold text-caption">
          동기화
        </span>
      </button>
    );
  }

  return <ActionButton onClick={handleConnect}>카카오 친구 연동하기</ActionButton>;
}
