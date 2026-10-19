// 친구별 다음 콕 찌르기 가능 시각을 브라우저 저장소에 보관하고 남은 대기 시간을 계산하는 훅
"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "needu:friend-poke:next-available-at:";
const MINUTE_MS = 60_000;
// 남은 시간을 분 단위로 표시하므로 이 간격마다 현재 시각을 갱신함
const TICK_INTERVAL_MS = 15_000;

const listeners = new Set<() => void>();

function getStorageKey(userId: number) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

// 사생활 보호 모드 등에서 저장소 접근이 막혀도 화면은 동작하도록 예외를 무시함
function readNextAvailableAt(userId: number) {
  try {
    const storedValue = window.localStorage.getItem(getStorageKey(userId));
    const timestamp = storedValue === null ? Number.NaN : Number(storedValue);

    return Number.isFinite(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
}

function writeNextAvailableAt(userId: number, timestamp: number | null) {
  try {
    if (timestamp === null) {
      window.localStorage.removeItem(getStorageKey(userId));
    } else {
      window.localStorage.setItem(getStorageKey(userId), String(timestamp));
    }
  } catch {
    // 저장소에 쓰지 못하면 현재 화면에서만 대기 상태를 유지함
  }

  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useFriendPokeCooldown(userId: number) {
  const nextAvailableAt = useSyncExternalStore(
    subscribe,
    () => readNextAvailableAt(userId),
    () => null,
  );
  const [now, setNow] = useState(() => Date.now());
  const remainingMs = nextAvailableAt === null ? 0 : Math.max(0, nextAvailableAt - now);
  const isCoolingDown = remainingMs > 0;
  // 1분 미만이 남아도 "1분 후"로 보이도록 분 단위로 올림함
  const remainingMinutes = Math.ceil(remainingMs / MINUTE_MS);

  // 대기 중에는 주기적으로 남은 시간을 갱신하고, 가능 시각이 되면 저장값을 지워 버튼을 다시 활성화함
  useEffect(() => {
    if (nextAvailableAt === null) return;

    const tickTimer = window.setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    const expireTimer = window.setTimeout(
      () => {
        setNow(Date.now());
        writeNextAvailableAt(userId, null);
      },
      Math.max(0, nextAvailableAt - Date.now()),
    );

    return () => {
      window.clearInterval(tickTimer);
      window.clearTimeout(expireTimer);
    };
  }, [userId, nextAvailableAt]);

  const startCooldown = useCallback(
    (timestamp: number) => {
      setNow(Date.now());
      writeNextAvailableAt(userId, timestamp);
    },
    [userId],
  );

  return { isCoolingDown, remainingMinutes, startCooldown };
}
