// 친구에게 콕찌르기 알림을 보내고, 다음 콕찌르기 가능 시각까지 버튼을 비활성화하는 버튼 UI
"use client";

import { useId, useState } from "react";

import { useFriendPokeCooldown } from "@/hooks/useFriendPokeCooldown";
import { ApiRequestError } from "@/lib/api/client";
import { pokeFriend } from "@/lib/api/friends";
import { parseServerDateTime } from "@/lib/parseServerDateTime";

type FriendPokeButtonProps = {
  userId: number;
  nickname: string;
};

export default function FriendPokeButton({ userId, nickname }: FriendPokeButtonProps) {
  const { isCoolingDown, remainingMinutes, startCooldown } = useFriendPokeCooldown(userId);
  const [isPoking, setIsPoking] = useState(false);
  const [hasJustPoked, setHasJustPoked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messageId = useId();
  // 방금 찌른 경우에는 성공 문구만, 다시 방문한 대기 중에는 남은 시간 문구만 보여줌
  const isSuccessMessageVisible = hasJustPoked && isCoolingDown;
  const isCooldownMessageVisible = !hasJustPoked && isCoolingDown;
  const hasMessage = isSuccessMessageVisible || isCooldownMessageVisible || Boolean(errorMessage);

  const handleClick = async () => {
    if (isPoking || isCoolingDown) return;

    setIsPoking(true);
    setErrorMessage(null);

    try {
      const poke = await pokeFriend(userId);

      startCooldown(parseServerDateTime(poke.nextPokeAvailableAt));
      setHasJustPoked(true);
    } catch (error) {
      // 다른 기기에서 이미 찔렀다면 남은 시간만큼 대기 상태로 전환하고 남은 시간 문구를 보여줌
      if (
        error instanceof ApiRequestError &&
        error.status === 429 &&
        error.retryAfterSeconds !== undefined
      ) {
        startCooldown(Date.now() + error.retryAfterSeconds * 1000);
        setHasJustPoked(false);
        return;
      }

      setErrorMessage(
        error instanceof ApiRequestError ? error.message : "친구를 콕 찌르지 못했습니다.",
      );
    } finally {
      setIsPoking(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={isPoking || isCoolingDown}
        aria-busy={isPoking}
        aria-describedby={hasMessage ? messageId : undefined}
        className="group inline-flex h-11 w-fit cursor-pointer items-center justify-center gap-1.5 rounded-full border border-foreground bg-foreground px-5 text-center text-background disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-muted"
        onClick={() => void handleClick()}
      >
        <strong className="text-body-sm font-bold">
          {nickname}님 <span className="text-primary group-disabled:text-muted">콕</span>찌르기
        </strong>
      </button>

      {hasMessage && (
        <p
          id={messageId}
          role="status"
          className={`m-0 text-body-sm ${isCooldownMessageVisible ? "text-danger" : "text-muted"}`}
        >
          {isSuccessMessageVisible && `${nickname}님을 콕 찔렀어요!`}
          {isCooldownMessageVisible && `${remainingMinutes}분 후 다시 콕! 찌를 수 있어요`}
          {!isCoolingDown && errorMessage}
        </p>
      )}
    </div>
  );
}
