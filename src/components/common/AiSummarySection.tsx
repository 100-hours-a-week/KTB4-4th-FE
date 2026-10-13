// AI 대화를 바탕으로 분석한 사용자의 관심사와 취미 요약 영역

import Image from "next/image";

type AiSummarySectionProps = {
  nickname: string;
  summary: string;
};

export default function AiSummarySection({ nickname, summary }: AiSummarySectionProps) {
  return (
    <section aria-labelledby="ai-summary-heading">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-background-subtle p-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface">
          <Image
            src="/images/Needu_profile.png"
            alt="니쥬 프로필"
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2
            id="ai-summary-heading"
            className="flex min-w-0 items-baseline whitespace-nowrap text-heading-3 font-bold text-foreground"
          >
            <span className="shrink-0">니쥬가 발견한&nbsp;</span>
            <span className="min-w-0 truncate text-info">{nickname}</span>
            <span className="shrink-0">님이에요!</span>
          </h2>
          <p className="mt-3 break-keep text-body leading-6 text-foreground-secondary">{summary}</p>
        </div>
      </div>
    </section>
  );
}
