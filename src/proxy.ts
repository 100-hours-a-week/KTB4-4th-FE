// 보호 페이지 요청의 인증 세션 검증과 액세스 토큰 재발급 프록시
import { NextResponse } from "next/server";

import { API_ENDPOINTS } from "@/lib/api/endpoints";

import type { NextRequest } from "next/server";

const LOGIN_PATH = "/login";
const ERROR_PATH = "/error";
const ACCESS_TOKEN_COOKIE = "NEEDU_ACCESS_TOKEN";
const REFRESH_TOKEN_COOKIE = "NEEDU_REFRESH_TOKEN";
const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

interface CsrfTokenResponse {
  data?: {
    token?: string;
  };
}

function createCookieStore(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  cookieHeader?.split(";").forEach((cookie) => {
    const separatorIndex = cookie.indexOf("=");

    if (separatorIndex === -1) return;

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();

    if (name) {
      cookies.set(name, value);
    }
  });

  return cookies;
}

function serializeCookies(cookies: Map<string, string>) {
  return Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ");
}

function collectSetCookieHeaders(
  response: Response,
  cookies: Map<string, string>,
  responseCookieHeaders: string[],
) {
  response.headers.getSetCookie().forEach((setCookieHeader) => {
    responseCookieHeaders.push(setCookieHeader);

    const [cookiePair] = setCookieHeader.split(";", 1);
    const separatorIndex = cookiePair.indexOf("=");

    if (separatorIndex === -1) return;

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    const isExpired = /(?:^|;)\s*max-age=0(?:;|$)/i.test(setCookieHeader);

    if (!name) return;

    if (!value || isExpired) {
      cookies.delete(name);
      return;
    }

    cookies.set(name, value);
  });
}

function appendSetCookieHeaders(response: NextResponse, setCookieHeaders: string[]) {
  setCookieHeaders.forEach((setCookieHeader) => {
    response.headers.append("set-cookie", setCookieHeader);
  });

  return response;
}

function createRedirectResponse(
  request: NextRequest,
  pathname: string,
  setCookieHeaders: string[],
) {
  return appendSetCookieHeaders(
    NextResponse.redirect(new URL(pathname, request.url)),
    setCookieHeaders,
  );
}

function createNextResponse(
  request: NextRequest,
  cookies: Map<string, string>,
  setCookieHeaders: string[],
) {
  const requestHeaders = new Headers(request.headers);
  const cookieHeader = serializeCookies(cookies);

  if (cookieHeader) {
    requestHeaders.set("cookie", cookieHeader);
  } else {
    requestHeaders.delete("cookie");
  }

  return appendSetCookieHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    setCookieHeaders,
  );
}

async function fetchAuthApi(
  request: NextRequest,
  endpoint: string,
  cookies: Map<string, string>,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  const cookieHeader = serializeCookies(cookies);

  headers.set("accept", "application/json");

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  return fetch(new URL(endpoint, request.url), {
    ...init,
    headers,
    cache: "no-store",
    redirect: "manual",
  });
}

export async function proxy(request: NextRequest) {
  const cookies = createCookieStore(request.headers.get("cookie"));
  const responseCookieHeaders: string[] = [];
  const hasAccessToken = cookies.has(ACCESS_TOKEN_COOKIE);
  const hasRefreshToken = cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasAccessToken && !hasRefreshToken) {
    return createRedirectResponse(request, LOGIN_PATH, responseCookieHeaders);
  }

  try {
    const sessionResponse = await fetchAuthApi(request, API_ENDPOINTS.auth.loginValidity, cookies);
    collectSetCookieHeaders(sessionResponse, cookies, responseCookieHeaders);

    if (sessionResponse.ok) {
      // TODO: 세션 API에 onboardingRequired와 currentStep이 추가되면 온보딩 분기 처리를 반영합니다.
      return createNextResponse(request, cookies, responseCookieHeaders);
    }

    if (sessionResponse.status !== 401) {
      if (sessionResponse.status === 429) {
        // TODO: Retry-After 기반 로그인 유효성 검사 재시도 처리를 추가합니다.
      }

      return createRedirectResponse(request, ERROR_PATH, responseCookieHeaders);
    }

    if (!cookies.has(REFRESH_TOKEN_COOKIE)) {
      return createRedirectResponse(request, LOGIN_PATH, responseCookieHeaders);
    }

    const csrfResponse = await fetchAuthApi(request, API_ENDPOINTS.auth.csrf, cookies);
    collectSetCookieHeaders(csrfResponse, cookies, responseCookieHeaders);

    if (!csrfResponse.ok) {
      const redirectPath = csrfResponse.status === 401 ? LOGIN_PATH : ERROR_PATH;
      return createRedirectResponse(request, redirectPath, responseCookieHeaders);
    }

    const csrfTokenResponse = (await csrfResponse.json()) as CsrfTokenResponse;
    const csrfToken = csrfTokenResponse.data?.token;

    if (!csrfToken) {
      return createRedirectResponse(request, ERROR_PATH, responseCookieHeaders);
    }

    const refreshResponse = await fetchAuthApi(request, API_ENDPOINTS.auth.refresh, cookies, {
      method: "POST",
      headers: {
        [CSRF_HEADER_NAME]: csrfToken,
      },
    });
    collectSetCookieHeaders(refreshResponse, cookies, responseCookieHeaders);

    if (!refreshResponse.ok) {
      const redirectPath = refreshResponse.status === 401 ? LOGIN_PATH : ERROR_PATH;
      return createRedirectResponse(request, redirectPath, responseCookieHeaders);
    }

    const revalidationResponse = await fetchAuthApi(
      request,
      API_ENDPOINTS.auth.loginValidity,
      cookies,
    );
    collectSetCookieHeaders(revalidationResponse, cookies, responseCookieHeaders);

    if (!revalidationResponse.ok) {
      const redirectPath = revalidationResponse.status === 401 ? LOGIN_PATH : ERROR_PATH;
      return createRedirectResponse(request, redirectPath, responseCookieHeaders);
    }

    return createNextResponse(request, cookies, responseCookieHeaders);
  } catch {
    return createRedirectResponse(request, ERROR_PATH, responseCookieHeaders);
  }
}

export const config = {
  matcher: [
    "/((?!api|login|error|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|icons).*)",
  ],
};
