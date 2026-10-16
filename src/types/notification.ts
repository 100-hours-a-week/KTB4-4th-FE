// 알림 목록·미읽음 상태·읽음 처리·모두 읽음 처리 응답과 알림 SSE 스트림 이벤트 데이터 타입
import type { ProductDetailContext } from "@/lib/api/productDetail";

export type NotificationCategory = "CHAT" | "POKE" | "EVENT" | "FRIEND_JOINED" | "PURCHASE_STATUS";

export type NotificationCategoryFilter = "ALL" | NotificationCategory;

// resourceType이 PURCHASE_CHECK인 구매 여부 알림의 미리보기로, 조회 시점의 최신 상품·친구 정보
export interface PurchaseCheckNotificationPreview {
  productId: number;
  productName: string;
  productImageUrl: string | null;
  context: ProductDetailContext;
  // FRIEND_GIFT이고 친구 관계가 확인될 때만 값이 있으며, 두 값은 항상 함께 있거나 함께 null임
  friendUserId: number | null;
  friendName: string | null;
}

export interface NotificationItem {
  notificationId: number;
  category: NotificationCategory;
  type: string;
  title: string;
  body: string;
  resourceType: string;
  // 콕 찌르기 알림처럼 연결된 리소스가 없으면 null로 내려옴
  resourceId: number | null;
  targetAvailable: boolean;
  // 구조가 resourceType마다 다르며, 다른 알림이거나 서버 미리보기 조회에 실패하면 없거나 null로 내려옴
  preview?: PurchaseCheckNotificationPreview | null;
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

export interface NotificationReadResult {
  notificationId: number;
  readAt: string;
  resourceType: string;
  resourceId: number | null;
  targetAvailable: boolean;
  unreadCount: number;
}

export interface NotificationReadAllResult {
  updatedCount: number;
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
