// AI 취향 분석 결과와 사용자 확인 선택지를 표시하는 모달

"use client";

import { useState } from "react";

import Modal from "@/components/common/Modal";
import type { PreferenceAnalysisKeyword, PreferenceAnalysisResult } from "@/types/chat";

import styles from "./PreferenceAnalysisResultModal.module.css";

type PreferenceAnalysisResultModalProps = {
  open: boolean;
  result: PreferenceAnalysisResult;
  onReject: () => void;
  onConfirm: () => void;
};

const sortByScore = (keywords: PreferenceAnalysisKeyword[]) =>
  [...keywords].sort((first, second) => second.score - first.score);

export default function PreferenceAnalysisResultModal({
  open,
  result,
  onReject,
  onConfirm,
}: PreferenceAnalysisResultModalProps) {
  const [interests, setInterests] = useState(() => sortByScore(result.interests));
  const [preferences, setPreferences] = useState(() => sortByScore(result.preferences));
  const [summary, setSummary] = useState(result.summary ?? null);
  const [summaryDraft, setSummaryDraft] = useState(result.summary ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [hasCorrected, setHasCorrected] = useState(false);

  const startEditing = () => {
    setSummaryDraft(summary ?? "");
    setIsEditing(true);
  };

  const updateAnalysis = () => {
    const nextSummary = summaryDraft.trim();

    // TODO: 취향 분석 결과 수정 API 연동 후 요약·키워드 변경 사항 저장
    setSummary(nextSummary.length > 0 ? nextSummary : null);
    setHasCorrected(true);
    setIsEditing(false);
  };

  const removeBadge = (
    badgeIndex: number,
    setBadges: React.Dispatch<React.SetStateAction<PreferenceAnalysisKeyword[]>>,
  ) => {
    setBadges((badges) => badges.filter((_, index) => index !== badgeIndex));
  };

  const renderBadges = (
    badges: PreferenceAnalysisKeyword[],
    category: "관심사" | "취향",
    setBadges: React.Dispatch<React.SetStateAction<PreferenceAnalysisKeyword[]>>,
  ) => (
    <div className="mt-3 flex flex-nowrap gap-1 overflow-x-auto pb-1">
      {badges.map((badge, index) => (
        <span
          key={`${badge.value}-${index}`}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[4px] bg-background-subtle px-2 py-1.5 text-[10px] font-bold text-muted"
        >
          <span>{badge.value}</span>
          <span className="rounded-full bg-info-subtle px-1 py-0.5 font-bold text-muted">
            {Math.round(Math.min(Math.max(badge.score, 0), 1) * 100)}%
          </span>
          {isEditing && (
            <button
              type="button"
              aria-label={`${category} ${badge.value} 삭제`}
              className={styles.badgeRemoveButton}
              onClick={() => removeBadge(index, setBadges)}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5">
                <path
                  d="m4 4 8 8m0-8-8 8"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          )}
        </span>
      ))}
    </div>
  );

  return (
    <div className={styles.scope}>
      <Modal
        open={open}
        onClose={onReject}
        title="이렇게 기억하려 해요"
        keepHeaderInteractive
        firstAction={
          result.correctionAvailable && !isEditing && !hasCorrected
            ? { label: "틀려요", onClick: startEditing }
            : undefined
        }
        secondAction={
          isEditing
            ? {
                label: "수정하기",
                type: "submit",
                form: "preference-analysis-correction-form",
                disabled: summaryDraft.trim().length === 0,
              }
            : { label: "맞아요", onClick: onConfirm }
        }
      >
        <p className="mt-0 text-body-sm text-foreground">
          니쥬가 분석한 내용이 맞다고 생각하시나요?
        </p>
        <div aria-label="취향 분석 결과" className="mt-6 space-y-5">
          <section aria-labelledby="preference-analysis-preferences">
            <h3 id="preference-analysis-preferences" className="text-body font-bold">
              취향
            </h3>
            {renderBadges(preferences, "취향", setPreferences)}
          </section>
          <section aria-labelledby="preference-analysis-interests">
            <h3 id="preference-analysis-interests" className="text-body font-bold">
              관심사
            </h3>
            {renderBadges(interests, "관심사", setInterests)}
          </section>
          {(summary !== null || isEditing) && (
            <section aria-labelledby="preference-analysis-summary">
              <h3 id="preference-analysis-summary" className="text-body font-bold">
                요약
              </h3>
              {isEditing ? (
                <form
                  id="preference-analysis-correction-form"
                  className="mt-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateAnalysis();
                  }}
                >
                  <input
                    type="text"
                    value={summaryDraft}
                    aria-label="요약 수정"
                    autoFocus
                    className={`${styles.summaryInput} w-full rounded-[4px] border-0 bg-background-subtle px-3 py-2 text-foreground placeholder:text-muted`}
                    placeholder="분석한 내용을 입력해주세요."
                    onChange={(event) => setSummaryDraft(event.target.value)}
                  />
                </form>
              ) : (
                <p className="mt-3 text-body-sm text-muted">{summary}</p>
              )}
            </section>
          )}
        </div>
      </Modal>
    </div>
  );
}
