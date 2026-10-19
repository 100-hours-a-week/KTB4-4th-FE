// 사용자 알림 설정 조회와 변경 API의 공통 타입

// 웹 푸시는 기기별 구독 API로 관리하므로 계정 단위 알림 설정 종류에 포함하지 않음
export type NotificationSettingType = "FRIEND_BIRTHDAY" | "FRIEND_JOINED" | "PURCHASE_FEEDBACK";

export interface NotificationSetting {
  type: NotificationSettingType;
  enabled: boolean;
  updatedAt: string | null;
}

export interface NotificationSettingsData {
  settings: NotificationSetting[];
}
