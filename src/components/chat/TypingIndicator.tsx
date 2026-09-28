// AI 응답 대기 상태를 안내하는 입력 중 말풍선 컴포넌트

import Image from "next/image";

import styles from "./TypingIndicator.module.css";

export default function TypingIndicator() {
  return (
    <article
      role="status"
      aria-label="니쥬가 답변을 작성하고 있어요"
      className="flex w-full items-center gap-3 pr-6"
    >
      <Image
        src="/images/Needu_profile.png"
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 object-contain"
      />

      <div className="min-w-0 max-w-[calc(100%-3.75rem)] rounded-md bg-surface p-4">
        <p className="text-body-sm font-bold text-foreground">니쥬</p>
        <span aria-hidden="true" className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </div>
    </article>
  );
}
