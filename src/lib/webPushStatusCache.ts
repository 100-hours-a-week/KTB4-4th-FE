// 현재 기기에서 마지막으로 확인한 웹 푸시 켜짐 여부를 브라우저 저장소에 보관하는 유틸 함수 모음
"use client";

export type CachedWebPushStatus = "on" | "off";

const STORAGE_KEY = "needu:web-push:last-status";

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

// 사생활 보호 모드 등에서 저장소 접근이 막혀도 동작하도록 예외를 무시함
export function readWebPushStatusCache(): CachedWebPushStatus | null {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    return storedValue === "on" || storedValue === "off" ? storedValue : null;
  } catch {
    return null;
  }
}

export function saveWebPushStatusCache(status: CachedWebPushStatus) {
  try {
    window.localStorage.setItem(STORAGE_KEY, status);
  } catch {
    // 저장소에 쓰지 못하면 다음 진입 시 상태 확인이 끝날 때까지 확인 중으로 표시함
  }

  notifyListeners();
}

// 로그아웃·탈퇴 등으로 사용자가 바뀔 수 있을 때 이전 사용자의 상태가 보이지 않도록 지움
export function clearWebPushStatusCache() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소에 접근하지 못하면 다음 상태 확인 결과로 덮어씀
  }

  notifyListeners();
}

export function subscribeWebPushStatusCache(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
