// 브라우저 웹 푸시 지원 여부 확인, VAPID 공개키 변환·비교, 현재 기기 구독 조회와 구독 생성·서버 등록(공개키 변경 시 이전 구독 정리)·해제 유틸 함수 모음
"use client";

import { ApiRequestError } from "@/lib/api/client";
import { registerPushSubscription, unregisterPushSubscription } from "@/lib/api/pushSubscriptions";

const SERVICE_WORKER_READY_TIMEOUT_MS = 10_000;

// iOS는 홈 화면에 설치된 PWA에서만 Push API를 제공하므로 일반 Safari 탭에서는 미지원으로 판단됨
export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");

  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function isSameApplicationServerKey(subscription: PushSubscription, publicKey: Uint8Array) {
  const currentKey = subscription.options.applicationServerKey;

  if (!currentKey) return false;

  const currentKeyBytes = new Uint8Array(currentKey);

  return (
    currentKeyBytes.length === publicKey.length &&
    currentKeyBytes.every((byte, index) => byte === publicKey[index])
  );
}

export function isSubscribedWithVapidKey(subscription: PushSubscription, vapidPublicKey: string) {
  return isSameApplicationServerKey(subscription, urlBase64ToUint8Array(vapidPublicKey));
}

// 서비스 워커 등록이 실패하면 ready가 끝나지 않으므로 일정 시간 후 실패로 처리함
function waitForServiceWorkerReady() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("서비스 워커가 준비되지 않았습니다.")),
        SERVICE_WORKER_READY_TIMEOUT_MS,
      );
    }),
  ]);
}

// 상태 조회는 서비스 워커 준비를 기다리지 않고, 등록된 서비스 워커가 없으면 구독이 없는 것으로 봄
export async function getCurrentPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

// 이 기기의 서버 구독을 삭제한 뒤 결과와 관계없이 브라우저 구독을 해제함
// 서버에 남은 구독은 다음 발송 시 푸시 서비스 응답(410)으로 정리되므로 실패해도 예외를 전달하지 않고,
// 호출한 쪽에서 로그인 페이지 이동 여부를 판단할 수 있도록 401 여부만 반환함
export async function unsubscribeCurrentDevice() {
  if (!isWebPushSupported()) return { isUnauthorized: false };

  const subscription = await getCurrentPushSubscription().catch(() => null);

  if (!subscription) return { isUnauthorized: false };

  let isUnauthorized = false;

  try {
    await unregisterPushSubscription(subscription.endpoint);
  } catch (error) {
    isUnauthorized = error instanceof ApiRequestError && error.status === 401;
  } finally {
    await subscription.unsubscribe().catch(() => false);
  }

  return { isUnauthorized };
}

let registerRequest: Promise<PushSubscription> | null = null;

// unsubscribe()는 호출한 객체와 관계없이 현재 등록된 구독을 해제하므로 구독 생성·등록이 동시에 실행되면
// 한쪽의 등록 실패 처리가 다른 쪽의 새 구독까지 해제할 수 있어 진행 중인 요청을 함께 사용함
export function ensurePushSubscriptionRegistered(vapidPublicKey: string) {
  if (!registerRequest) {
    registerRequest = createAndRegisterPushSubscription(vapidPublicKey).finally(() => {
      registerRequest = null;
    });
  }

  return registerRequest;
}

// 구독을 서버에 등록하고, 등록에 실패하면 브라우저에만 구독이 남지 않도록 해제함
async function createAndRegisterPushSubscription(vapidPublicKey: string) {
  const subscription = await getOrCreatePushSubscription(vapidPublicKey);

  try {
    await registerPushSubscription(subscription);
  } catch (error) {
    await subscription.unsubscribe().catch(() => false);
    throw error;
  }

  return subscription;
}

// 기존 구독이 현재 공개키로 만들어졌으면 재사용하고, 공개키가 바뀌었으면 해제 후 다시 구독함
async function getOrCreatePushSubscription(vapidPublicKey: string) {
  const registration = await waitForServiceWorkerReady();
  const publicKey = urlBase64ToUint8Array(vapidPublicKey);
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription && isSameApplicationServerKey(existingSubscription, publicKey)) {
    return existingSubscription;
  }

  if (existingSubscription) {
    // 이전 공개키 구독은 발송 시 푸시 서비스가 거부만 하고 서버에서 정리되지 않으므로 먼저 서버 구독을 삭제함
    // 삭제에 실패해도 새 공개키로 다시 구독하는 흐름은 계속 진행함
    await unregisterPushSubscription(existingSubscription.endpoint).catch(() => undefined);
    await existingSubscription.unsubscribe();
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
  });
}
