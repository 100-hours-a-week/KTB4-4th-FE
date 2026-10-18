// 사용자 알림 설정 조회를 위한 서버 API 요청
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { NotificationSettingsData } from "@/lib/api/notificationSettingTypes";
import { serverApiRequest } from "@/lib/api/serverClient";

interface GetNotificationSettingsResponse {
  message: string;
  data: NotificationSettingsData;
}

export async function getNotificationSettings() {
  const { data } = await serverApiRequest<GetNotificationSettingsResponse>(
    API_ENDPOINTS.users.notificationSettings,
    {
      method: "GET",
      fallbackErrorMessage: "알림 설정을 불러오지 못했습니다.",
    },
  );

  return data;
}
