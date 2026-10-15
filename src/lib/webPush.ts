// 브라우저 웹 푸시 지원 여부 확인, VAPID 공개키 변환·비교, 현재 기기 구독 조회·생성 유틸 함수 모음
"use client";

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

// 기존 구독이 현재 공개키로 만들어졌으면 재사용하고, 공개키가 바뀌었으면 해제 후 다시 구독함
export async function getOrCreatePushSubscription(vapidPublicKey: string) {
  const registration = await waitForServiceWorkerReady();
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
