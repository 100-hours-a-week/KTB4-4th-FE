// 현재 기기의 웹 푸시 구독 상태 확인과 구독 켜기·끄기를 처리하는 훅
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useToastContext } from "@/contexts/ToastContext";
import { ApiRequestError } from "@/lib/api/client";
import { getPushSubscriptionStatus, getVapidPublicKey } from "@/lib/api/pushSubscriptions";
import {
  ensurePushSubscriptionRegistered,
  getCurrentPushSubscription,
  isWebPushSupported,
  unsubscribeCurrentDevice,
} from "@/lib/webPush";

type WebPushStatus = "checking" | "on" | "off";

type StatusCheckResult = { subscribed: boolean } | { error: unknown };

const UNSUPPORTED_MESSAGE =
  "이 브라우저에서는 웹 푸시 알림을 사용할 수 없습니다. iPhone은 홈 화면에 추가한 뒤 이용해 주세요.";
const PERMISSION_DENIED_MESSAGE = "브라우저 설정에서 알림 권한을 허용해 주세요.";
const KEY_UNAVAILABLE_MESSAGE = "웹 푸시 알림을 사용할 수 없습니다.";
const ENABLE_FAILED_MESSAGE = "웹 푸시 알림을 켜지 못했습니다. 잠시 후 다시 시도해 주세요.";
const STATUS_FAILED_MESSAGE =
  "웹 푸시 알림 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (!(error instanceof ApiRequestError)) return fallbackMessage;

  if (error.status === 429 && error.retryAfterSeconds !== undefined) {
    return `${error.message} ${error.retryAfterSeconds}초 후 다시 시도해 주세요.`;
  }

  return error.message;
};

// 서버 오류는 재시도 안내가 포함된 상태 확인 실패 문구로 보여줌
const getStatusErrorMessage = (error: unknown) => {
  if (!(error instanceof ApiRequestError) || error.status >= 500) return STATUS_FAILED_MESSAGE;

  return getErrorMessage(error, STATUS_FAILED_MESSAGE);
};

// 권한이 있고 브라우저 구독이 있을 때만 상태 조회 API를 호출하며, 서버에도 현재 사용자로 등록돼 있어야 켜진 것으로 봄
async function checkCurrentDeviceSubscribed() {
  if (!isWebPushSupported() || Notification.permission !== "granted") return false;

  const subscription = await getCurrentPushSubscription();

  if (!subscription) return false;

  const { subscribed } = await getPushSubscriptionStatus(subscription.endpoint);
  return subscribed;
}

// 공개키를 사용할 수 없으면 null을 반환하며, 토글 클릭 시 안내 토스트로 처리함
function loadVapidPublicKey() {
  return getVapidPublicKey().catch(() => null);
}

export default function useWebPushSubscription() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [status, setStatus] = useState<WebPushStatus>("checking");
  const [isPending, setIsPending] = useState(false);
  const isPendingRef = useRef(false);
  const vapidPublicKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const statusRequest: Promise<StatusCheckResult> = checkCurrentDeviceSubscribed().then(
      (subscribed) => ({ subscribed }),
      (error: unknown) => ({ error }),
    );
    // 토글 클릭 시 권한 요청 전에 비동기 작업이 없도록 공개키를 미리 조회해 둠
    const keyRequest = isWebPushSupported() ? loadVapidPublicKey() : Promise.resolve(null);

    void Promise.all([statusRequest, keyRequest]).then(([result, vapidPublicKey]) => {
      if (isCancelled) return;

      vapidPublicKeyRef.current = vapidPublicKey;

      if ("subscribed" in result) {
        setStatus(result.subscribed ? "on" : "off");
        return;
      }

      setStatus("off");

      if (result.error instanceof ApiRequestError && result.error.status === 401) {
        router.replace("/login");
        return;
      }

      showToast(getStatusErrorMessage(result.error));
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

    const vapidPublicKey = vapidPublicKeyRef.current;

    if (!vapidPublicKey) {
      showToast(KEY_UNAVAILABLE_MESSAGE);
      // 다음 클릭에서 사용할 수 있도록 공개키를 다시 조회함
      void loadVapidPublicKey().then((publicKey) => {
        vapidPublicKeyRef.current = publicKey;
      });
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

      try {
        // 서버 등록에 실패하면 브라우저 구독 해제까지 처리된 뒤 에러가 전달됨
        await ensurePushSubscriptionRegistered(vapidPublicKey);
      } catch (error) {
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

  // 서버 구독 삭제에 실패해도 브라우저 구독은 해제되며, 실패를 안내하지 않음
  const disable = async () => {
    if (isPendingRef.current || status !== "on") return;

    isPendingRef.current = true;
    setIsPending(true);
    setStatus("off");

    try {
      const { isUnauthorized } = await unsubscribeCurrentDevice();

      if (isUnauthorized) {
        router.replace("/login");
      }
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  return { status, isPending, enable, disable };
}
