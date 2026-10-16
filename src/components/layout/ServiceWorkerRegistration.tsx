// 앱 진입 시 웹 푸시 수신용 서비스 워커를 등록하고, VAPID 공개키가 바뀐 기존 구독을 다시 구독하는 컴포넌트
"use client";

import { useEffect } from "react";

import { getVapidPublicKey } from "@/lib/api/pushSubscriptions";
import {
  ensurePushSubscriptionRegistered,
  getCurrentPushSubscription,
  isSubscribedWithVapidKey,
  isWebPushSupported,
} from "@/lib/webPush";

const SERVICE_WORKER_PATH = "/sw.js";

// 사용자가 켜 둔 기기(권한 허용 + 브라우저 구독 있음)만 대상으로 하며, 공개키가 같으면 아무것도 하지 않음
async function resubscribeIfVapidKeyChanged() {
  if (!isWebPushSupported() || Notification.permission !== "granted") return;

  const subscription = await getCurrentPushSubscription();

  if (!subscription) return;

  const vapidPublicKey = await getVapidPublicKey();

  if (isSubscribedWithVapidKey(subscription, vapidPublicKey)) return;

  // 서버 등록에 실패하면 브라우저 구독 해제까지 처리된 뒤 에러가 전달됨
  await ensurePushSubscriptionRegistered(vapidPublicKey);
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(SERVICE_WORKER_PATH, { scope: "/" })
      .then(() =>
        // 사용자 동작 없이 진행되는 동기화이므로 실패해도 토스트 없이 기록만 남김
        resubscribeIfVapidKeyChanged().catch((error) => {
          console.error("웹 푸시 재구독에 실패했습니다.", error);
        }),
      )
      .catch((error) => {
        console.error("서비스 워커 등록에 실패했습니다.", error);
      });
  }, []);

  return null;
}
