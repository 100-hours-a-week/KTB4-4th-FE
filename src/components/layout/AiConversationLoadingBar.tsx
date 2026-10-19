// AI 대화 시작 요청 중 헤더 아래에 표시하는 무한 진행 바

import styles from "./AiConversationLoadingBar.module.css";

export default function AiConversationLoadingBar() {
  return (
    <div role="progressbar" aria-label="AI 대화 준비 중" className={styles.track}>
      <span aria-hidden="true" className={styles.bar} />
    </div>
  );
}
