// AI 대화에서 수집된 취향 정보의 분석 진행률 컴포넌트
"use client";

import { useEffect } from "react";

import { usePreferenceAnalysisBarStore } from "@/stores/preferenceAnalysisBarStore";
import type { PreferenceAnalysis } from "@/types/chat";

type PreferenceAnalysisBarProps = PreferenceAnalysis;

const clampProgress = (progress: number) => Math.min(Math.max(progress, 0), 100);

export default function PreferenceAnalysisBar({
  progress,
  description,
}: PreferenceAnalysisBarProps) {
  const normalizedProgress = clampProgress(progress);
  const isCollapsed = usePreferenceAnalysisBarStore((state) => state.isCollapsed);
  const toggleCollapsed = usePreferenceAnalysisBarStore((state) => state.toggleCollapsed);

  useEffect(() => {
    void usePreferenceAnalysisBarStore.persist.rehydrate();
  }, []);

  return (
    <section
      aria-labelledby="preference-analysis-title"
      className="relative shrink-0 rounded-lg border border-border bg-surface/80 px-4 py-3 opacity-75 shadow-md backdrop-blur-sm"
    >
      <div className="flex items-center gap-1 pr-10">
        <div className="flex items-baseline gap-1">
          <h1 id="preference-analysis-title" className="text-body-lg font-bold text-foreground">
            취향 분석
          </h1>
          <strong className="text-body-lg font-bold text-info">{normalizedProgress}%</strong>
        </div>

        <button
          type="button"
          aria-controls="preference-analysis-details"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "취향 분석 진행률 펼치기" : "취향 분석 진행률 접기"}
          onClick={toggleCollapsed}
          className="absolute top-0.5 right-2 flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-muted transition-colors hover:text-foreground focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-info"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-[var(--duration-base)] ${
              isCollapsed ? "" : "rotate-180"
            }`}
          >
            <path
              d="M5 9L12 16L19 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div id="preference-analysis-details" hidden={isCollapsed}>
        <div
          role="progressbar"
          aria-label="취향 분석 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={normalizedProgress}
          className="mt-2 h-2 overflow-hidden rounded-full bg-disabled"
        >
          <div
            aria-hidden="true"
            className="h-full rounded-full bg-primary transition-[width] duration-[var(--duration-base)]"
            style={{ width: `${normalizedProgress}%` }}
          />
        </div>

        <p className="mt-1 text-body-sm text-foreground-secondary">{description}</p>
      </div>
    </section>
  );
}
