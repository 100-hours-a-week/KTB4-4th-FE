// 보호 페이지 요청의 인증 세션 검증과 액세스 토큰 재발급 프록시
import { NextResponse } from "next/server";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { isOnboardingStatusResponse } from "@/lib/api/onboardingStatus";

import type { NextRequest } from "next/server";

const LOGIN_PATH = "/login";
const ERROR_PATH = "/error";
const ONBOARDING_PATH = "/onboarding";
const ACCESS_TOKEN_COOKIE = "NEEDU_ACCESS_TOKEN";
const REFRESH_TOKEN_COOKIE = "NEEDU_REFRESH_TOKEN";
const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

interface CsrfTokenResponse {
  data?: {
    token?: string;
  };
}

type AuthRequestStage = "session" | "csrf" | "refresh" | "revalidation" | "onboarding";

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

function getBackendApiBaseUrl() {
  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL?.trim();

  if (!backendApiBaseUrl) {
    throw new Error("BACKEND_API_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  const normalizedBaseUrl = new URL(
    backendApiBaseUrl.endsWith("/") ? backendApiBaseUrl : `${backendApiBaseUrl}/`,
  );

  if (!new Set(["http:", "https:"]).has(normalizedBaseUrl.protocol)) {
    throw new Error("BACKEND_API_BASE_URL은 HTTP 또는 HTTPS 주소여야 합니다.");
  }

  return normalizedBaseUrl;
}

function createAuthLogContext(
  request: NextRequest,
  cookies: Map<string, string>,
  stage: AuthRequestStage,
  endpoint: string,
) {
  return {
    pathname: request.nextUrl.pathname,
    stage,
    endpoint,
    hasAccessToken: cookies.has(ACCESS_TOKEN_COOKIE),
    hasRefreshToken: cookies.has(REFRESH_TOKEN_COOKIE),
  };
}

function logAuthApiFailure(
  request: NextRequest,
  cookies: Map<string, string>,
  stage: AuthRequestStage,
  endpoint: string,
  status: number,
  reason = "non-success response",
) {
  const logContext = {
    ...createAuthLogContext(request, cookies, stage, endpoint),
    status,
    reason,
  };

  if (status === 401) {
    console.warn("[proxy] auth API rejected request", logContext);
    return;
  }

  console.error("[proxy] auth API request failed", logContext);
}

function getErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      message: String(error),
    };
  }

  const cause = error.cause;

  if (!(cause instanceof Error)) {
    return {
      name: error.name,
      message: error.message,
      ...(cause === undefined ? {} : { cause: String(cause) }),
    };
  }

  const causeCode = (cause as Error & { code?: unknown }).code;

  return {
    name: error.name,
    message: error.message,
    cause: {
      name: cause.name,
      message: cause.message,
      ...(typeof causeCode === "string" ? { code: causeCode } : {}),
    },
  };
}

function logAuthRequestError(
  request: NextRequest,
  cookies: Map<string, string>,
  stage: AuthRequestStage,
  endpoint: string,
  error: unknown,
) {
  console.error("[proxy] auth request threw an error", {
    ...createAuthLogContext(request, cookies, stage, endpoint),
    error: getErrorDetails(error),
  });
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

  return fetch(new URL(endpoint, getBackendApiBaseUrl()), {
    ...init,
    headers,
    cache: "no-store",
    redirect: "manual",
  });
}

async function routeByOnboardingStatus(
  request: NextRequest,
  cookies: Map<string, string>,
  responseCookieHeaders: string[],
) {
  if (request.nextUrl.pathname === ONBOARDING_PATH) {
    return createNextResponse(request, cookies, responseCookieHeaders);
  }

  const onboardingResponse = await fetchAuthApi(API_ENDPOINTS.users.onboardingStatus, cookies);
  collectSetCookieHeaders(onboardingResponse, cookies, responseCookieHeaders);

  if (!onboardingResponse.ok) {
    logAuthApiFailure(
      request,
      cookies,
      "onboarding",
      API_ENDPOINTS.users.onboardingStatus,
      onboardingResponse.status,
    );

    const redirectPath = onboardingResponse.status === 401 ? LOGIN_PATH : ERROR_PATH;
    return createRedirectResponse(request, redirectPath, responseCookieHeaders);
  }

  const responseBody = (await onboardingResponse.json().catch(() => null)) as unknown;

  if (!isOnboardingStatusResponse(responseBody)) {
    logAuthApiFailure(
      request,
      cookies,
      "onboarding",
      API_ENDPOINTS.users.onboardingStatus,
      onboardingResponse.status,
      "invalid onboarding status response",
    );
    return createRedirectResponse(request, ERROR_PATH, responseCookieHeaders);
  }

  if (responseBody.data.completed) {
    return createNextResponse(request, cookies, responseCookieHeaders);
  }

  const onboardingUrl = new URL(ONBOARDING_PATH, request.url);
  onboardingUrl.searchParams.set("currentStep", responseBody.data.currentStep);

  return appendSetCookieHeaders(NextResponse.redirect(onboardingUrl), responseCookieHeaders);
}

export async function proxy(request: NextRequest) {
  const cookies = createCookieStore(request.headers.get("cookie"));
  const responseCookieHeaders: string[] = [];
  const hasAccessToken = cookies.has(ACCESS_TOKEN_COOKIE);
  const hasRefreshToken = cookies.has(REFRESH_TOKEN_COOKIE);
  let authRequestStage: AuthRequestStage = "session";
  let authEndpoint: string = API_ENDPOINTS.auth.loginValidity;

  if (!hasAccessToken && !hasRefreshToken) {
    return createRedirectResponse(request, LOGIN_PATH, responseCookieHeaders);
  }

  try {
    const sessionResponse = await fetchAuthApi(API_ENDPOINTS.auth.loginValidity, cookies);
    collectSetCookieHeaders(sessionResponse, cookies, responseCookieHeaders);

    if (sessionResponse.ok) {
      authRequestStage = "onboarding";
      authEndpoint = API_ENDPOINTS.users.onboardingStatus;
      return await routeByOnboardingStatus(request, cookies, responseCookieHeaders);
    }

    logAuthApiFailure(request, cookies, authRequestStage, authEndpoint, sessionResponse.status);

    if (sessionResponse.status !== 401) {
      if (sessionResponse.status === 429) {
        // TODO: Retry-After 기반 로그인 유효성 검사 재시도 처리를 추가합니다.
      }

      return createRedirectResponse(request, ERROR_PATH, responseCookieHeaders);
    }

    if (!cookies.has(REFRESH_TOKEN_COOKIE)) {
      return createRedirectResponse(request, LOGIN_PATH, responseCookieHeaders);
    }

    authRequestStage = "csrf";
    authEndpoint = API_ENDPOINTS.auth.csrf;
    const csrfResponse = await fetchAuthApi(API_ENDPOINTS.auth.csrf, cookies);
    collectSetCookieHeaders(csrfResponse, cookies, responseCookieHeaders);

    if (!csrfResponse.ok) {
      logAuthApiFailure(request, cookies, authRequestStage, authEndpoint, csrfResponse.status);
      const redirectPath = csrfResponse.status === 401 ? LOGIN_PATH : ERROR_PATH;
      return createRedirectResponse(request, redirectPath, responseCookieHeaders);
    }

    const csrfTokenResponse = (await csrfResponse.json()) as CsrfTokenResponse;
    const csrfToken = csrfTokenResponse.data?.token;

    if (!csrfToken) {
      logAuthApiFailure(
        request,
        cookies,
        authRequestStage,
        authEndpoint,
        csrfResponse.status,
        "missing CSRF token in response",
      );
      return createRedirectResponse(request, ERROR_PATH, responseCookieHeaders);
    }

    authRequestStage = "refresh";
    authEndpoint = API_ENDPOINTS.auth.refresh;
    const refreshResponse = await fetchAuthApi(API_ENDPOINTS.auth.refresh, cookies, {
      method: "POST",
      headers: {
        [CSRF_HEADER_NAME]: csrfToken,
      },
    });
    collectSetCookieHeaders(refreshResponse, cookies, responseCookieHeaders);

    if (!refreshResponse.ok) {
      logAuthApiFailure(request, cookies, authRequestStage, authEndpoint, refreshResponse.status);
      const redirectPath = refreshResponse.status === 401 ? LOGIN_PATH : ERROR_PATH;
      return createRedirectResponse(request, redirectPath, responseCookieHeaders);
    }

    authRequestStage = "revalidation";
    authEndpoint = API_ENDPOINTS.auth.loginValidity;
    const revalidationResponse = await fetchAuthApi(API_ENDPOINTS.auth.loginValidity, cookies);
    collectSetCookieHeaders(revalidationResponse, cookies, responseCookieHeaders);

    if (!revalidationResponse.ok) {
      logAuthApiFailure(
        request,
        cookies,
        authRequestStage,
        authEndpoint,
        revalidationResponse.status,
      );
      const redirectPath = revalidationResponse.status === 401 ? LOGIN_PATH : ERROR_PATH;
      return createRedirectResponse(request, redirectPath, responseCookieHeaders);
    }

    authRequestStage = "onboarding";
    authEndpoint = API_ENDPOINTS.users.onboardingStatus;
    return await routeByOnboardingStatus(request, cookies, responseCookieHeaders);
  } catch (error) {
    logAuthRequestError(request, cookies, authRequestStage, authEndpoint, error);
    return createRedirectResponse(request, ERROR_PATH, responseCookieHeaders);
  }
}

export const config = {
  matcher: [
    "/((?!api|login|error|_next/static|_next/image|favicon.ico|icon.png|sitemap.xml|robots.txt|images|icons).*)",
  ],
};
