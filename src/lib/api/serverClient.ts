// 서버 컴포넌트의 백엔드 JSON API 요청을 위한 공통 클라이언트
import "server-only";

import { cookies } from "next/headers";

interface ServerApiErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

export type ServerApiRequestOptions = Omit<RequestInit, "cache" | "redirect"> & {
  fallbackErrorMessage: string;
};

export class ServerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
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

function getRetryAfterSeconds(response: Response, errorResponse: ServerApiErrorResponse | null) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");

  if (!retryAfterHeader) {
    return undefined;
  }

  const seconds = Number(retryAfterHeader);

  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds));
  }

  const retryAt = Date.parse(retryAfterHeader);

  if (Number.isNaN(retryAt)) {
    return undefined;
  }

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

export async function serverApiRequest<TResponse>(
  endpoint: string,
  { fallbackErrorMessage, ...init }: ServerApiRequestOptions,
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  const cookieHeader = (await cookies()).toString();

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  } else {
    headers.delete("cookie");
  }

  const response = await fetch(new URL(endpoint, getBackendApiBaseUrl()), {
    ...init,
    method: init.method?.toUpperCase() ?? "GET",
    headers,
    cache: "no-store",
    redirect: "manual",
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as ServerApiErrorResponse | null;

    throw new ServerApiError(
      errorResponse?.message ?? fallbackErrorMessage,
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  return (await response.json()) as TResponse;
}
