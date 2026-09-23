// 카카오 친구 연동 인증 화면으로 이동하는 버튼
"use client";

import ActionButton from "@/components/common/ActionButton";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export default function KakaoFriendConnectButton() {
  const handleConnect = () => {
    const authorizeUrl = new URL(API_ENDPOINTS.friends.kakaoAuthorize, window.location.origin);
    const returnUrl = new URL("/friends", window.location.origin);

    authorizeUrl.searchParams.set("returnUrl", returnUrl.toString());
    window.location.assign(authorizeUrl.toString());
  };

  return <ActionButton onClick={handleConnect}>카카오 친구 연동하기</ActionButton>;
}
