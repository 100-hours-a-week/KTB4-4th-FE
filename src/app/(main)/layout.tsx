// 서버 프록시 인증이 적용된 공통 보호 페이지 레이아웃
import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";
import { AiConversationProvider } from "@/contexts/AiConversationContext";

import type { ReactNode } from "react";

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AiConversationProvider>
      <Header />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      <BottomNavigation />
    </AiConversationProvider>
  );
}
