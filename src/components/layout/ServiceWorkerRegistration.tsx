// 앱 진입 시 웹 푸시 수신용 서비스 워커를 등록하고, 로그아웃 전 켜 두었던 같은 사용자의 구독 복원과 VAPID 공개키가 바뀐 기존 구독의 재구독을 처리하는 컴포넌트
"use client";

import { useEffect } from "react";

import { getVapidPublicKey } from "@/lib/api/pushSubscriptions";
import {
  ensurePushSubscriptionRegistered,
  getCurrentPushSubscription,
  isSubscribedWithVapidKey,
  isWebPushSupported,
} from "@/lib/webPush";
import { restoreWebPushForSameUser } from "@/lib/webPushRestore";

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
      // 사용자 동작 없이 진행되는 동기화이므로 실패해도 토스트 없이 기록만 남김
      // 복원한 구독은 현재 공개키로 만들어지므로 재구독 확인 전에 복원을 먼저 처리함
      .then(() =>
        restoreWebPushForSameUser().catch((error) => {
          console.error("웹 푸시 구독 복원에 실패했습니다.", error);
        }),
      )
      .then(() =>
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
