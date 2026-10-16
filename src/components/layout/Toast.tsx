// 하단 내비게이션 바로 위에 일시적으로 표시되는 토스트 메시지
"use client";

import { useToastContext } from "@/contexts/ToastContext";

// 콘텐츠 영역과 하단 내비게이션 사이에 높이 없이 배치해 하단 내비게이션 위를 기준으로 위치함
export default function Toast() {
  const { toast } = useToastContext();

  if (!toast) return null;

  return (
    <div className="relative z-20 h-0 shrink-0">
      <p
        key={toast.id}
        role="alert"
        className="absolute right-4 bottom-10 left-4 rounded-sm bg-danger-subtle px-3 py-2 text-center text-body-sm text-danger shadow-sm"
      >
        {toast.message}
      </p>
    </div>
  );
}
