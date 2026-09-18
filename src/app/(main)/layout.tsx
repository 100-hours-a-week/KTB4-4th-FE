import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";

import type { ReactNode } from "react";

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <Header />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      <BottomNavigation />
    </>
  );
}
