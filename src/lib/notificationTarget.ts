// 알림을 눌렀을 때 알림 종류와 연결된 리소스에 맞춰 이동할 화면 경로를 결정하는 유틸 함수
import type { NotificationItem } from "@/types/notification";

type NotificationTarget = Pick<
  NotificationItem,
  "type" | "resourceType" | "resourceId" | "targetAvailable"
>;

// 이동하지 않는 알림이면 null을 반환하며, 이 경우 읽음 처리만 함
export function getNotificationTargetPath({
  type,
  resourceType,
  resourceId,
  targetAvailable,
}: NotificationTarget) {
  if (!targetAvailable) return null;

  // 콕 찌르기는 기존 리소스가 아니라 새 AI 대화를 시작하므로 식별자 없이 AI 대화 화면으로 이동함
  if (type === "POKE") return "/ai";

  switch (resourceType) {
    case "USER":
      return resourceId === null ? null : `/friends/${resourceId}`;
    case "PURCHASE_CHECK":
      // TODO: 상품 관련 알림 모달 구현 후 알림 클릭 시 모달 열기 연결
      return null;
    case "AI_CONVERSATION":
      // TODO: 콕 찌르기 외 AI 대화 알림의 이동 화면 확정 후 연결
      return null;
    default:
      return null;
  }
}
