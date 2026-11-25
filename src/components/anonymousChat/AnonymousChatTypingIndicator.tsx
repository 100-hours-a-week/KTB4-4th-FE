// 익명대화 상대방이 메시지를 입력 중일 때 표시하는 말풍선 컴포넌트

import AnonymousChatProfileImage from "@/components/anonymousChat/AnonymousChatProfileImage";
import TypingDots from "@/components/chat/TypingDots";
import type { AnonymousChatProfile } from "@/types/anonymousChatProfile";

type AnonymousChatTypingIndicatorProps = {
  counterpartName: string;
  counterpartProfile: AnonymousChatProfile;
};

export default function AnonymousChatTypingIndicator({
  counterpartName,
  counterpartProfile,
}: AnonymousChatTypingIndicatorProps) {
  return (
    <article
      role="status"
      aria-label={`${counterpartName}님이 입력하고 있어요`}
      className="flex gap-2 pr-12"
    >
      <AnonymousChatProfileImage
        profile={counterpartProfile}
        alt=""
        size={36}
        className="h-9 w-9"
      />
      <div className="min-w-0">
        <p className="text-caption font-bold text-foreground">{counterpartName}</p>
        <div className="mt-1.5 w-fit rounded-[18px] rounded-tl-[4px] bg-surface px-4 py-2.5">
          <TypingDots />
        </div>
      </div>
    </article>
  );
}
