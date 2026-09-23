// AI 취향 분석 결과와 사용자 확인 선택지를 표시하는 모달

"use client";

import { useState } from "react";

import Modal from "@/components/common/Modal";
import type { PreferenceAnalysisResult } from "@/types/chat";

import styles from "./PreferenceAnalysisResultModal.module.css";

type PreferenceAnalysisResultModalProps = {
  open: boolean;
  result: PreferenceAnalysisResult;
  onReject: () => void;
  onConfirm: () => void;
};

export default function PreferenceAnalysisResultModal({
  open,
  result,
  onReject,
  onConfirm,
}: PreferenceAnalysisResultModalProps) {
  // TODO: API 응답의 유사도 내림차순에 따라 왼쪽에서 오른쪽으로 배지를 정렬
  const [interests, setInterests] = useState(result.interests ?? []);
  const [preferences, setPreferences] = useState(result.preferences ?? []);
  const [summary, setSummary] = useState(result.summary ?? null);
  const [summaryDraft, setSummaryDraft] = useState(result.summary ?? "");
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const startEditingSummary = () => {
    setSummaryDraft(summary ?? "");
    setIsEditingSummary(true);
  };

  const updateSummary = () => {
    const nextSummary = summaryDraft.trim();

    // TODO: API 연동 시 취향 분석 요약 수정은 최초 1회만 허용
    setSummary(nextSummary.length > 0 ? nextSummary : null);
    setIsEditingSummary(false);
  };

  const removeBadge = (
    badgeIndex: number,
    setBadges: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setBadges((badges) => badges.filter((_, index) => index !== badgeIndex));
  };

  const renderBadges = (
    badges: string[],
    category: "관심사" | "취향",
    setBadges: React.Dispatch<React.SetStateAction<string[]>>,
  ) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <span
          key={`${badge}-${index}`}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] bg-background-subtle py-2 pr-2 pl-3 text-xs font-medium text-muted"
        >
          {badge}
          <button
            type="button"
            aria-label={`${category} ${badge} 삭제`}
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
        firstAction={{
          label: "틀려요",
          onClick: startEditingSummary,
          disabled: isEditingSummary,
        }}
        secondAction={{ label: "맞아요", onClick: onConfirm, disabled: isEditingSummary }}
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
          {(summary !== null || isEditingSummary) && (
            <section aria-labelledby="preference-analysis-summary">
              <h3 id="preference-analysis-summary" className="text-body font-bold">
                요약
              </h3>
              {isEditingSummary ? (
                <form
                  className="mt-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateSummary();
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
                  <button
                    type="submit"
                    className="mt-2 flex h-11 w-full cursor-pointer items-center justify-center rounded-[6px] border-0 bg-primary px-4 text-body font-normal text-on-primary"
                  >
                    수정하기
                  </button>
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
