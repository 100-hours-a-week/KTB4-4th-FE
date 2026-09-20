// AI 대화에서 수집된 취향 정보의 분석 진행률 컴포넌트

import type { PreferenceAnalysis } from "@/types/chat";

type PreferenceAnalysisBarProps = PreferenceAnalysis;

const clampProgress = (progress: number) => Math.min(Math.max(progress, 0), 100);

export default function PreferenceAnalysisBar({
  progress,
  description,
}: PreferenceAnalysisBarProps) {
  const normalizedProgress = clampProgress(progress);

  return (
    <section
      aria-labelledby="preference-analysis-title"
      className="shrink-0 rounded-md border border-border-strong bg-surface p-4"
    >
      <div className="flex items-baseline gap-1">
        <h1 id="preference-analysis-title" className="text-heading-3 font-bold text-foreground">
          취향 분석
        </h1>
        <strong className="text-heading-3 font-bold text-[#4684e9]">{normalizedProgress}%</strong>
      </div>

      <div
        role="progressbar"
        aria-label="취향 분석 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedProgress}
        className="mt-3 h-3 overflow-hidden rounded-full bg-disabled"
      >
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-primary transition-[width] duration-[var(--duration-base)]"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>

      <p className="mt-3 text-body text-foreground-secondary">{description}</p>
    </section>
  );
}
