// 알림 목록 조회 응답과 알림 SSE 스트림 이벤트 데이터 타입

export type NotificationCategory = "CHAT" | "POKE" | "EVENT" | "FRIEND_JOINED";

export type NotificationCategoryFilter = "ALL" | NotificationCategory;

export interface NotificationItem {
  notificationId: number;
  category: NotificationCategory;
  type: string;
  title: string;
  body: string;
  resourceType: string;
  resourceId: number;
  targetAvailable: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListParams {
  category?: NotificationCategoryFilter;
  cursor?: string;
  size?: number;
  since?: string;
}

export interface NotificationListData {
  items: NotificationItem[];
  unreadCount: number;
  newCount: number;
  serverTime: string;
}

export interface NotificationListPage extends NotificationListData {
  nextCursor: string | null;
  hasNext: boolean;
}

export interface NotificationSummary {
  hasUnread: boolean;
  unreadCount: number;
}

export interface NotificationConnectedEvent {
  connectedAt: string;
}

export interface NotificationHeartbeatEvent {
  serverTime: string;
}

export interface NotificationCreatedEvent extends Omit<NotificationItem, "readAt"> {
  unreadCount: number;
}
