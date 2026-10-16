// 화면 하단에 일시적으로 표시할 토스트 메시지를 공유하는 Context
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const TOAST_DURATION_MS = 3000;

type Toast = {
  id: number;
  message: string;
};

type ToastContextValue = {
  toast: Toast | null;
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef(0);

  // 새 토스트가 오면 이전 토스트를 교체하고 표시 시간을 다시 시작함
  const showToast = useCallback((message: string) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message });
    hideTimerRef.current = setTimeout(() => {
      setToast(null);
      hideTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ toast, showToast }), [toast, showToast]);

  return <ToastContext value={value}>{children}</ToastContext>;
}

export function useToastContext() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToastContext는 ToastProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
