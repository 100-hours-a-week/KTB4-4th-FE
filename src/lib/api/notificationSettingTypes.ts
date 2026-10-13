// 사용자 알림 설정 조회와 변경 API의 공통 타입

export type NotificationSettingType =
  "WEB_PUSH" | "FRIEND_BIRTHDAY" | "FRIEND_JOINED" | "PURCHASE_FEEDBACK";

export interface NotificationSetting {
  type: NotificationSettingType;
  enabled: boolean;
  updatedAt: string | null;
}

export interface NotificationSettingsData {
  settings: NotificationSetting[];
}
