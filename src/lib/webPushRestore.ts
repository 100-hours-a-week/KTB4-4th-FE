// 로그아웃 전 웹 푸시를 켜 두었던 사용자 id를 브라우저 저장소에 보관하고, 같은 사용자 재로그인 시 복원 대상을 판단하는 ·재구독하는 유틸 함수 모음
"use client";

import { checkLoginValidity } from "@/lib/api/loginValidity";
import { getVapidPublicKey } from "@/lib/api/pushSubscriptions";
import {
  ensurePushSubscriptionRegistered,
  getCurrentPushSubscription,
  isWebPushSupported,
} from "@/lib/webPush";

const STORAGE_KEY = "needu:web-push:restore-user-id";

// 한 기기에서 마지막으로 웹 푸시를 켠 채 로그아웃한 사용자만 보관함
export function saveWebPushRestoreUserId(userId: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(userId));
  } catch {
    // 저장소에 쓰지 못하면 재로그인 시 복원하지 않음
  }
}

// 사생활 보호 모드 등에서 저장소 접근이 막혀도 동작하도록 예외를 무시함
export function readWebPushRestoreUserId() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const userId = storedValue === null ? Number.NaN : Number(storedValue);

    return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

export function clearWebPushRestoreUserId() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소에 접근하지 못하면 남은 값은 다음 복원 시도에서 사용자 id 비교로 걸러짐
  }
}

// 로그아웃 정리 전에 호출하며, 권한이 허용되고 이 기기에 구독이 있으면 현재 사용자를 복원 대상으로 저장함
// 서버 등록에 실패한 구독은 브라우저에서도 해제되므로 브라우저 구독이 있으면 켜진 상태로 판단함
export async function rememberWebPushForRestore() {
  if (!isWebPushSupported() || Notification.permission !== "granted") return;

  const subscription = await getCurrentPushSubscription().catch(() => null);

  if (!subscription) return;

  const loginSession = await checkLoginValidity().catch(() => null);

  if (!loginSession) return;

  saveWebPushRestoreUserId(loginSession.user.id);
}

// 앱 진입 시 호출하며, 저장된 사용자와 현재 로그인 사용자가 같을 때만 다시 구독하고 서버에 등록함
// 다른 사용자가 로그인한 경우 원래 사용자가 돌아올 때까지 저장값을 유지하고 구독하지 않음
export async function restoreWebPushForSameUser() {
  const restoreUserId = readWebPushRestoreUserId();

  if (restoreUserId === null) return;

  // 브라우저 설정에서 알림 권한을 해제했다면 복원하지 않음
  if (!isWebPushSupported() || Notification.permission !== "granted") {
    clearWebPushRestoreUserId();
    return;
  }

  const loginSession = await checkLoginValidity();

  if (loginSession.user.id !== restoreUserId) return;

  // 복원에 실패해도 매 진입마다 재시도하지 않도록 먼저 삭제하며, 이후에는 설정 화면에서 다시 켤 수 있음
  clearWebPushRestoreUserId();

  const vapidPublicKey = await getVapidPublicKey();

  // 서버 등록에 실패하면 브라우저 구독 해제까지 처리된 뒤 에러가 전달됨
  await ensurePushSubscriptionRegistered(vapidPublicKey);
}
