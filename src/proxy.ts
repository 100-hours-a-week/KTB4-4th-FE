// 인증 쿠키 존재 여부를 기준으로 보호 페이지 접근을 제한하는 프록시
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "NEEDU_ACCESS_TOKEN";
const REFRESH_TOKEN_COOKIE = "NEEDU_REFRESH_TOKEN";

export function proxy(request: NextRequest) {
  // TODO: 세션 확인 API 구현 후 쿠키 존재 여부 검사를 액세스 토큰 유효성 검증 및 재발급 흐름으로 교체합니다.
  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasAccessToken && !hasRefreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|login|error|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|icons).*)",
  ],
};
