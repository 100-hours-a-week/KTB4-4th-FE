// 탭별 대화가 없을 때 안내 아이콘과 문구를 표시하는 컴포넌트

import type { AnonymousChatType } from "@/lib/api/anonymousChats";

type EmptyAnonymousChatsProps = {
  type: AnonymousChatType;
};

const EMPTY_CONTENT: Record<AnonymousChatType, { title: string; description: string }> = {
  SENT: {
    title: "아직 물어본 대화가 없어요.",
    description: "친구에게 선물이 마음에 드는지 물어보면 이곳에 표시돼요.",
  },
  RECEIVED: {
    title: "아직 받은 질문이 없어요.",
    description: "친구가 나에게 선물을 물어보면 이곳에 표시돼요.",
  },
};

export default function EmptyAnonymousChats({ type }: EmptyAnonymousChatsProps) {
  const content = EMPTY_CONTENT[type];

  return (
    <section className="mt-[clamp(96px,16vh,160px)] flex flex-col items-center text-center">
      <svg
        aria-hidden="true"
        className="h-24 w-24 text-muted"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="48" cy="48" r="48" className="fill-background-subtle" />
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
      <p className="mt-4 text-body-lg font-bold text-foreground">{content.title}</p>
      <p className="mt-1 break-keep text-body-sm text-muted">{content.description}</p>
    </section>
  );
}
