// 메시지가 없는 채팅방에서 첫 익명 질문 작성을 안내하는 대화 시작 전 화면

export default function AnonymousChatStartGuide() {
  return (
    <section
      aria-label="대화 시작 안내"
      className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 text-center"
    >
      <svg
        aria-hidden="true"
        className="h-24 w-24 text-muted"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="48" cy="48" r="48" className="fill-surface" />
        <path
          d="M34 64.5A20 20 0 1 0 27.5 58L24 70Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M41.5 42A6.5 6.5 0 0 1 54 44.2C54 48.5 48 50.5 48 50.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M48 57.5H48.02" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="mt-4 text-body-lg font-bold text-foreground">아직 익명 대화가 없어요</p>
      <p className="mt-1 break-keep text-body-sm text-muted">
        아래 입력창에서 상품에 대해 슬쩍 물어보면
        <br />
        상대에게 익명으로 질문이 전달돼요.
      </p>
      <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-caption font-bold text-foreground-secondary">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 10V7A4 4 0 0 1 16 7V10" stroke="currentColor" strokeWidth="2" />
        </svg>
        프로필은 공개되지 않아요
      </p>
    </section>
  );
}
