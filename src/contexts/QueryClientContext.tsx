// 서버 상태 요청·캐시를 관리하는 TanStack Query 클라이언트 공급 컴포넌트
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// 화면별로 필요한 경우에만 옵션을 덮어쓰도록 기본값은 요청 재시도·포커스 재요청을 끈 상태로 둠
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // 렌더링마다 캐시가 초기화되지 않도록 클라이언트를 한 번만 생성함
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
