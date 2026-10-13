// 사용자 알림 설정 변경 API 요청과 응답 타입
"use client";

import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type NotificationSettingType =
  "WEB_PUSH" | "FRIEND_BIRTHDAY" | "FRIEND_JOINED" | "PURCHASE_FEEDBACK";

export interface NotificationSetting {
  type: NotificationSettingType;
  enabled: boolean;
  updatedAt: string;
}

interface UpdateNotificationSettingResponse {
  message: string;
  data: NotificationSetting;
}

interface UpdateNotificationSettingErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

const DEFAULT_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  422: "입력 값이 유효하지 않습니다. 입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: UpdateNotificationSettingErrorResponse | null,
) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(retryAfterSeconds) ? Math.max(0, Math.ceil(retryAfterSeconds)) : undefined;
}

export async function updateNotificationSetting(
  settingType: NotificationSettingType,
  enabled: boolean,
) {
  const response = await apiFetch(API_ENDPOINTS.users.notificationSetting(settingType), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as UpdateNotificationSettingErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        DEFAULT_ERROR_MESSAGES[response.status] ??
        "알림 설정을 변경하지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as UpdateNotificationSettingResponse;
  return data;
}
