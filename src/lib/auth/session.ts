// 로그아웃·회원 탈퇴 API 호출 전 이 기기의 알림 SSE 연결과 웹 푸시 구독·상태 캐시를 정리하는 유틸 함수
"use client";

import { closeNotificationStream } from "@/lib/api/notificationStream";
import { unsubscribeCurrentDevice } from "@/lib/webPush";
import { clearWebPushStatusCache } from "@/lib/webPushStatusCache";

// 웹 푸시 구독 삭제 API는 로그인 상태가 필요하므로 로그아웃·탈퇴 API보다 먼저 호출해야 함
// 구독 삭제에 실패(401 포함)해도 브라우저 구독은 해제되며 세션 종료 흐름은 계속 진행함
export async function cleanupBeforeSessionEnd() {
  closeNotificationStream();
  await unsubscribeCurrentDevice();
  clearWebPushStatusCache();
}
