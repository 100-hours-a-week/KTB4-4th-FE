// 현재 기기의 웹 푸시 구독 상태 확인과 구독 켜기를 처리하는 훅
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useToastContext } from "@/contexts/ToastContext";
import { ApiRequestError } from "@/lib/api/client";
import { getPushSubscriptionStatus, registerPushSubscription } from "@/lib/api/pushSubscriptions";
import {
  getCurrentPushSubscription,
  getOrCreatePushSubscription,
  getVapidPublicKey,
  isWebPushSupported,
} from "@/lib/webPush";

type WebPushStatus = "checking" | "on" | "off";

const UNSUPPORTED_MESSAGE =
  "이 브라우저에서는 웹 푸시 알림을 사용할 수 없습니다. iPhone은 홈 화면에 추가한 뒤 이용해 주세요.";
const PERMISSION_DENIED_MESSAGE = "브라우저 설정에서 알림 권한을 허용해 주세요.";
const MISSING_KEY_MESSAGE = "웹 푸시 알림을 사용할 수 없습니다.";
const ENABLE_FAILED_MESSAGE = "웹 푸시 알림을 켜지 못했습니다. 잠시 후 다시 시도해 주세요.";
const STATUS_FAILED_MESSAGE = "웹 푸시 알림 상태를 확인하지 못했습니다.";

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (!(error instanceof ApiRequestError)) return fallbackMessage;

  if (error.status === 429 && error.retryAfterSeconds !== undefined) {
    return `${error.message} ${error.retryAfterSeconds}초 후 다시 시도해 주세요.`;
  }

  return error.message;
};

// 브라우저 구독이 있고 서버에도 현재 사용자로 등록돼 있을 때만 이 기기의 웹 푸시가 켜진 것으로 봄
async function checkCurrentDeviceSubscribed() {
  if (!isWebPushSupported() || !getVapidPublicKey()) return false;
  if (Notification.permission !== "granted") return false;

  const subscription = await getCurrentPushSubscription();

  if (!subscription) return false;

  const { subscribed } = await getPushSubscriptionStatus(subscription.endpoint);
  return subscribed;
}

export default function useWebPushSubscription() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [status, setStatus] = useState<WebPushStatus>("checking");
  const [isPending, setIsPending] = useState(false);
  const isPendingRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    checkCurrentDeviceSubscribed()
      .then((subscribed) => {
        if (!isCancelled) setStatus(subscribed ? "on" : "off");
      })
      .catch((error: unknown) => {
        if (isCancelled) return;

        setStatus("off");

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        showToast(getErrorMessage(error, STATUS_FAILED_MESSAGE));
      });

    return () => {
      isCancelled = true;
    };
  }, [router, showToast]);

  // iOS는 사용자 동작 안에서만 권한 요청을 허용하므로 다른 비동기 작업보다 권한 요청을 먼저 실행함
  const enable = async () => {
    if (isPendingRef.current || status !== "off") return;

    if (!isWebPushSupported()) {
      showToast(UNSUPPORTED_MESSAGE);
      return;
    }

    const vapidPublicKey = getVapidPublicKey();

    if (!vapidPublicKey) {
      showToast(MISSING_KEY_MESSAGE);
      return;
    }

    if (Notification.permission === "denied") {
      showToast(PERMISSION_DENIED_MESSAGE);
      return;
    }

    isPendingRef.current = true;
    setIsPending(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        if (permission === "denied") showToast(PERMISSION_DENIED_MESSAGE);
        return;
      }

      setStatus("on");

      let subscription: PushSubscription;

      try {
        subscription = await getOrCreatePushSubscription(vapidPublicKey);
      } catch {
        setStatus("off");
        showToast(ENABLE_FAILED_MESSAGE);
        return;
      }

      try {
        await registerPushSubscription(subscription);
      } catch (error) {
        // 서버 등록에 실패하면 브라우저에만 구독이 남지 않도록 해제함
        await subscription.unsubscribe().catch(() => false);
        setStatus("off");

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        showToast(getErrorMessage(error, ENABLE_FAILED_MESSAGE));
      }
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  return { status, isPending, enable };
}
