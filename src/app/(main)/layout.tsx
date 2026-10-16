// 서버 프록시 인증이 적용된 공통 보호 페이지 레이아웃
import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";
import ServiceWorkerRegistration from "@/components/layout/ServiceWorkerRegistration";
import Toast from "@/components/layout/Toast";
import { AiConversationProvider } from "@/contexts/AiConversationContext";
import { FriendDetailProvider } from "@/contexts/FriendDetailContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";

import type { ReactNode } from "react";

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <NotificationProvider>
      <ToastProvider>
        <ServiceWorkerRegistration />
        <AiConversationProvider>
          <FriendDetailProvider>
            <Header />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
            <Toast />
            <BottomNavigation />
          </FriendDetailProvider>
        </AiConversationProvider>
      </ToastProvider>
    </NotificationProvider>
  );
}
