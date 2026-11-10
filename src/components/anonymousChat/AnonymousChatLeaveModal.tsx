// 익명 채팅방을 나가기 전 한 번 더 확인하고 나가기를 요청하는 모달
"use client";

import { useEffect, useState } from "react";

import Modal from "@/components/common/Modal";
import { leaveAnonymousChat } from "@/lib/api/anonymousChats";
import { ApiRequestError, redirectToLogin } from "@/lib/api/client";

type AnonymousChatLeaveModalProps = {
  chatId: number | null;
  onClose: () => void;
  onLeft: (chatId: number) => void;
};

const ONBOARDING_REQUIRED_MESSAGE = "온보딩 진행이 필요합니다.";

export default function AnonymousChatLeaveModal({
  chatId,
  onClose,
  onLeft,
}: AnonymousChatLeaveModalProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;

    const retryTimer = window.setTimeout(() => {
      setRetryAfterSeconds((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => window.clearTimeout(retryTimer);
  }, [retryAfterSeconds]);

  const handleClose = () => {
    if (isLeaving) return;

    setErrorMessage(null);
    setRetryAfterSeconds(0);
    onClose();
  };

  const handleConfirm = async () => {
    if (chatId === null || retryAfterSeconds > 0) return;

    setIsLeaving(true);
    setErrorMessage(null);

    try {
      await leaveAnonymousChat(chatId);
      onLeft(chatId);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        redirectToLogin();
        return;
      }

      if (
        error instanceof ApiRequestError &&
        error.status === 403 &&
        error.message === ONBOARDING_REQUIRED_MESSAGE
      ) {
        window.location.replace("/onboarding");
        return;
      }

      if (error instanceof ApiRequestError && error.status === 429) {
        setRetryAfterSeconds(Math.max(0, error.retryAfterSeconds ?? 0));
      }

      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "채팅방을 나가지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Modal
      open={chatId !== null}
      onClose={handleClose}
      title="채팅방을 나가시겠습니까?"
      description="나가면 대화 내용을 다시 볼 수 없어요."
      childrenClassName="mt-3"
      actionsClassName="mt-10"
      firstAction={{ label: "취소", disabled: isLeaving, onClick: handleClose }}
      secondAction={{
        label: isLeaving
          ? "나가는 중"
          : retryAfterSeconds > 0
            ? `${retryAfterSeconds}초 후 다시 시도`
            : "나가기",
        disabled: isLeaving || retryAfterSeconds > 0,
        "aria-busy": isLeaving,
        onClick: () => void handleConfirm(),
      }}
    >
      {errorMessage && (
        <p role="alert" className="m-0 text-body-sm text-danger">
          {errorMessage}
        </p>
      )}
    </Modal>
  );
}
