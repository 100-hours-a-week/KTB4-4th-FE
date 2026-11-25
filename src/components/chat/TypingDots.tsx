// AI 채팅·익명대화에서 함께 쓰는 입력 중 점 3개 애니메이션

import styles from "./TypingDots.module.css";

export default function TypingDots() {
  return (
    <span aria-hidden="true" className={styles.dots}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  );
}
