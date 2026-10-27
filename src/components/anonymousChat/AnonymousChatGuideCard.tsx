// 채팅방 상단에서 대화 종류별 익명 대화 안내 문구를 표시하는 카드

import type { AnonymousChatType } from "@/lib/api/anonymousChats";

type AnonymousChatGuideCardProps = {
  counterpartName: string;
  type: AnonymousChatType;
};

const GUIDE_COPY: Record<AnonymousChatType, { titleSuffix: string; description: string }> = {
  SENT: {
    titleSuffix: "님에게 이 상품은 어떨지 슬쩍 물어보고 있어요!",
    description: "내 이름과 프로필은 보이지 않고 대화만 전달돼요.",
  },
  RECEIVED: {
    titleSuffix: "님이 선물 의견을 궁금해하고 있어요.",
    description: "선물하는 사람은 랜덤 별명으로 표시돼요.",
  },
};

export default function AnonymousChatGuideCard({
  counterpartName,
  type,
}: AnonymousChatGuideCardProps) {
  const { titleSuffix, description } = GUIDE_COPY[type];

  return (
    <section className="rounded-md bg-surface px-4 py-4 text-foreground">
      <p className="break-keep text-body font-bold">
        <span className="text-info">{counterpartName}</span>
        {titleSuffix}
      </p>
      <p className="mt-0.5 break-keep text-caption text-muted">{description}</p>
    </section>
  );
}
