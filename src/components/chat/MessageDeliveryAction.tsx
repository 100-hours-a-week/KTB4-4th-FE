// 메시지 재전송 버튼과 재전송 진행 상태를 표시하는 공통 액션

import styles from "./MessageDeliveryAction.module.css";

type MessageDeliveryActionProps =
  | {
      status: "FAILED";
      onRetry: () => void;
      disabled?: boolean;
      remainingRetrySeconds?: number;
      variant?: "grouped" | "standalone";
    }
  | {
      status: "RETRYING";
      variant?: "grouped" | "standalone";
    };

export default function MessageDeliveryAction(props: MessageDeliveryActionProps) {
  const variant = props.variant ?? "standalone";
  const variantClassName =
    variant === "standalone"
      ? `${styles.standalone} rounded-md border-0`
      : "border-0 bg-transparent";

  if (props.status === "RETRYING") {
    return (
      <span
        role="status"
        aria-label="메시지 재전송 중"
        className={`${styles.action} ${variantClassName} flex h-7 w-7 shrink-0 items-center justify-center text-muted`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 animate-spin"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2.5"
            className="opacity-25"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  const remainingRetrySeconds = props.remainingRetrySeconds ?? 0;
  const isDisabled = props.disabled ?? false;
  const accessibleLabel = isDisabled
    ? `${remainingRetrySeconds}초 후 메시지 재전송 가능`
    : "메시지 재전송";

  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      title={accessibleLabel}
      disabled={isDisabled}
      onClick={props.onRetry}
      className={`${styles.action} ${variantClassName} flex h-7 w-7 shrink-0 items-center justify-center text-muted transition-colors hover:bg-surface/60 hover:text-foreground focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-3.36-7.02" />
        <path d="M21 3v6h-6" />
      </svg>
    </button>
  );
}
