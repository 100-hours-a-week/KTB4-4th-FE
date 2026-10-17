// 설정 화면에서 현재 기기의 웹 푸시 알림을 켜고 끄는 토글 항목
"use client";

import useWebPushSubscription from "@/hooks/useWebPushSubscription";

const LABEL_ID = "web-push-notification-label";

export default function WebPushSettingItem() {
  const { status, cachedStatus, isPending, isVapidKeyLoading, enable, disable } =
    useWebPushSubscription();
  // 상태 확인 중에는 마지막으로 확인한 상태를 먼저 보여주고, 확인이 끝날 때까지 누를 수 없게 함
  const isEnabled = status === "checking" ? cachedStatus === "on" : status === "on";
  // 켜기에는 공개키가 필요하므로 꺼진 상태에서는 공개키 조회가 끝날 때까지 누를 수 없게 함
  const isDisabled = status === "checking" || isPending || (status === "off" && isVapidKeyLoading);

  const handleToggle = () => {
    void (isEnabled ? disable() : enable());
  };

  return (
    <li className="flex min-h-[64px] items-center justify-between gap-4 border-b border-border py-2 pr-2">
      <div className="min-w-0">
        <span id={LABEL_ID} className="text-body-sm">
          웹 푸시 알림
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        aria-busy={status === "checking" || isPending}
        aria-labelledby={LABEL_ID}
        disabled={isDisabled}
        className="relative h-touch w-11 shrink-0 border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleToggle}
      >
        <span
          aria-hidden="true"
          className={`absolute left-0 top-1/2 h-5 w-11 -translate-y-1/2 rounded-full transition-colors duration-200 ${
            isEnabled ? "bg-primary" : "bg-disabled"
          }`}
        >
          <span
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface shadow-sm transition-[left] duration-200 ${
              isEnabled ? "left-[26px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </li>
  );
}
