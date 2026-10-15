// 브라우저 웹 푸시 지원 여부 확인, VAPID 공개키 변환·비교, 현재 기기 구독 조회·생성 유틸 함수 모음
"use client";

// iOS는 홈 화면에 설치된 PWA에서만 Push API를 제공하므로 일반 Safari 탭에서는 미지원으로 판단됨
export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
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

export async function getCurrentPushSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

// 기존 구독이 현재 공개키로 만들어졌으면 재사용하고, 공개키가 바뀌었으면 해제 후 다시 구독함
export async function getOrCreatePushSubscription(vapidPublicKey: string) {
  const registration = await navigator.serviceWorker.ready;
  const publicKey = urlBase64ToUint8Array(vapidPublicKey);
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription && isSameApplicationServerKey(existingSubscription, publicKey)) {
    return existingSubscription;
  }

  await existingSubscription?.unsubscribe();

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
  });
}
