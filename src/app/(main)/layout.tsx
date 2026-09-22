// 공통 레이아웃과 로그인 유효성 확인을 적용하는 보호 페이지 레이아웃
import LoginValidityGuard from "@/components/auth/LoginValidityGuard";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";

import type { ReactNode } from "react";

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <LoginValidityGuard>
      <Header />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      <BottomNavigation />
    </LoginValidityGuard>
  );
}
