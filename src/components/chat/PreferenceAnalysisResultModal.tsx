// AI 취향 분석 결과와 사용자 확인 선택지를 표시하는 모달

"use client";

import { useLayoutEffect, useRef, useState } from "react";

import Modal from "@/components/common/Modal";
import type { PreferenceAnalysisKeyword, PreferenceAnalysisResult } from "@/types/chat";

import styles from "./PreferenceAnalysisResultModal.module.css";

type PreferenceAnalysisResultModalProps = {
  open: boolean;
  result: PreferenceAnalysisResult;
  onReject: () => void;
  onConfirm: () => Promise<void>;
  onUpdateAnalysis: (analysis: {
    summary: string;
    preferences: PreferenceAnalysisKeyword[];
    interests: PreferenceAnalysisKeyword[];
  }) => Promise<PreferenceAnalysisResult>;
  isConfirming: boolean;
};

const sortByScore = (keywords: PreferenceAnalysisKeyword[]) =>
  [...keywords].sort((first, second) => second.score - first.score);

export default function PreferenceAnalysisResultModal({
  open,
  result,
  onReject,
  onConfirm,
  onUpdateAnalysis,
  isConfirming,
}: PreferenceAnalysisResultModalProps) {
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [interests, setInterests] = useState(() => sortByScore(result.interests));
  const [preferences, setPreferences] = useState(() => sortByScore(result.preferences));
  const [interestDrafts, setInterestDrafts] = useState(() => sortByScore(result.interests));
  const [preferenceDrafts, setPreferenceDrafts] = useState(() => sortByScore(result.preferences));
  const [summary, setSummary] = useState(result.summary ?? null);
  const [summaryDraft, setSummaryDraft] = useState(result.summary ?? "");
  const [correctionAvailable, setCorrectionAvailable] = useState(result.correctionAvailable);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState("");
  const [confirmErrorMessage, setConfirmErrorMessage] = useState("");

  useLayoutEffect(() => {
    const textarea = summaryTextareaRef.current;

    if (!isEditing || !textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [isEditing, summaryDraft]);

  const startEditing = () => {
    setSummaryDraft(summary ?? "");
    setInterestDrafts(interests);
    setPreferenceDrafts(preferences);
    setUpdateErrorMessage("");
    setIsEditing(true);
  };

  const removeBadge = (
    badgeIndex: number,
    setBadges: React.Dispatch<React.SetStateAction<PreferenceAnalysisKeyword[]>>,
  ) => {
    setBadges((badges) => badges.filter((_, index) => index !== badgeIndex));
  };

  const updateAnalysis = async () => {
    const nextSummary = summaryDraft.trim();

    if (!nextSummary || isUpdating) return;

    setIsUpdating(true);
    setUpdateErrorMessage("");

    try {
      const updatedResult = await onUpdateAnalysis({
        summary: nextSummary,
        preferences: preferenceDrafts,
        interests: interestDrafts,
      });

      const nextInterests = sortByScore(updatedResult.interests);
      const nextPreferences = sortByScore(updatedResult.preferences);

      setInterests(nextInterests);
      setPreferences(nextPreferences);
      setInterestDrafts(nextInterests);
      setPreferenceDrafts(nextPreferences);
      setSummary(updatedResult.summary);
      setSummaryDraft(updatedResult.summary ?? "");
      setCorrectionAvailable(updatedResult.correctionAvailable);
      setIsEditing(false);
    } catch (error) {
      setUpdateErrorMessage(
        error instanceof Error ? error.message : "취향 분석 결과를 수정하지 못했습니다.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmAnalysis = async () => {
    if (isConfirming) return;

    setConfirmErrorMessage("");

    try {
      await onConfirm();
    } catch (error) {
      setConfirmErrorMessage(
        error instanceof Error ? error.message : "취향 분석 결과를 확정하지 못했습니다.",
      );
    }
  };

  const renderBadges = (
    badges: PreferenceAnalysisKeyword[],
    setBadges: React.Dispatch<React.SetStateAction<PreferenceAnalysisKeyword[]>>,
  ) => (
    <div className="mt-3 flex flex-wrap gap-1">
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
              aria-label={`${badge.value} 배지 삭제`}
              disabled={isUpdating}
              className={`${styles.badgeRemoveButton} inline-flex shrink-0 items-center justify-center text-base leading-none font-bold text-muted`}
              onClick={() => removeBadge(index, setBadges)}
            >
              <span aria-hidden="true">×</span>
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
          correctionAvailable && !isEditing
            ? { label: "틀려요", onClick: startEditing, disabled: isConfirming }
            : undefined
        }
        secondAction={
          isEditing
            ? {
                label: isUpdating ? "수정 중..." : "수정하기",
                type: "submit",
                form: "preference-analysis-correction-form",
                disabled: summaryDraft.trim().length === 0 || isUpdating,
                "aria-busy": isUpdating || undefined,
              }
            : {
                label: isConfirming ? "확정 중..." : "맞아요",
                onClick: () => void confirmAnalysis(),
                disabled: isConfirming,
                "aria-busy": isConfirming || undefined,
              }
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
            {renderBadges(isEditing ? preferenceDrafts : preferences, setPreferenceDrafts)}
          </section>
          <section aria-labelledby="preference-analysis-interests">
            <h3 id="preference-analysis-interests" className="text-body font-bold">
              관심사
            </h3>
            {renderBadges(isEditing ? interestDrafts : interests, setInterestDrafts)}
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
                    void updateAnalysis();
                  }}
                >
                  <textarea
                    ref={summaryTextareaRef}
                    value={summaryDraft}
                    aria-label="요약 수정"
                    autoFocus
                    disabled={isUpdating}
                    rows={1}
                    className={`${styles.summaryInput} block w-full resize-none overflow-hidden rounded-[4px] border-0 bg-background-subtle px-3 py-2 text-foreground placeholder:text-muted`}
                    placeholder="분석한 내용을 입력해주세요."
                    onChange={(event) => setSummaryDraft(event.target.value)}
                  />
                  {updateErrorMessage && (
                    <p role="alert" className="mt-2 text-body-sm text-danger">
                      {updateErrorMessage}
                    </p>
                  )}
                </form>
              ) : (
                <p className="mt-3 text-body-sm text-muted">{summary}</p>
              )}
            </section>
          )}
          {confirmErrorMessage && (
            <p role="alert" className="text-body-sm text-danger">
              {confirmErrorMessage}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
