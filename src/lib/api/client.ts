// CSRF 보호와 액세스 토큰 재발급을 포함하는 공통 API 요청 클라이언트
"use client";

import { getCsrfHeaders } from "@/lib/api/csrf";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

const LOGIN_PATH = "/login";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

let refreshRequest: Promise<void> | null = null;
let refreshVersion = 0;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function createRequestInit(init: RequestInit) {
  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(init.headers);

  if (!SAFE_METHODS.has(method)) {
    const csrfHeaders = await getCsrfHeaders();

    Object.entries(csrfHeaders).forEach(([name, value]) => {
      headers.set(name, value);
    });
  }

  return {
    ...init,
    method,
    headers,
    credentials: "include" as const,
  };
}

async function requestRefresh(forceCsrfRefresh = false) {
  const response = await fetch(API_ENDPOINTS.auth.refresh, {
    method: "POST",
    headers: await getCsrfHeaders(forceCsrfRefresh),
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 403 && !forceCsrfRefresh) {
    return requestRefresh(true);
  }

  if (!response.ok) {
    throw new ApiRequestError("액세스 토큰 재발급에 실패했습니다.", response.status);
  }
}

export function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = requestRefresh()
      .then(() => {
        refreshVersion += 1;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

function redirectToLogin() {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH);
  }
}

export async function apiFetch(input: string | URL, init: RequestInit = {}) {
  const requestVersion = refreshVersion;
  const requestInit = await createRequestInit(init);
  const response = await fetch(input, requestInit);

  if (response.status !== 401 || input.toString().includes(API_ENDPOINTS.auth.refresh)) {
    return response;
  }

  try {
    if (requestVersion === refreshVersion) {
      await refreshAccessToken();
    }
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirectToLogin();
    }

    throw error;
  }

  return fetch(input, requestInit);
}
