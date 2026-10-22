// proxy가 요청 헤더로 전달한 로그인 사용자 정보를 서버 컴포넌트에서 읽는 함수
import "server-only";

import { headers } from "next/headers";

import { isLoginUser, LOGIN_SESSION_USER_HEADER, type LoginUser } from "@/lib/api/loginSession";

// proxy를 거치지 않은 경로이거나 헤더 값이 올바르지 않으면 null 반환
export async function getServerLoginUser(): Promise<LoginUser | null> {
  const encodedUser = (await headers()).get(LOGIN_SESSION_USER_HEADER);

  if (!encodedUser) {
    return null;
  }

  try {
    const user = JSON.parse(decodeURIComponent(encodedUser)) as unknown;

    return isLoginUser(user) ? user : null;
  } catch {
    return null;
  }
}
