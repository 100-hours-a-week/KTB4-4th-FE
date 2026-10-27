// 사용자의 취향 데이터에 맞는 콘텐츠를 서버에서 조회해 제공하는 메인 화면

import { redirect } from "next/navigation";
import { Suspense } from "react";

import HomeContent from "@/components/home/HomeContent";
import HomeContentSkeleton from "@/components/home/HomeContentSkeleton";
import { getServerLoginUser } from "@/lib/api/serverSession";

export default async function Home() {
  // proxy가 검증한 세션 정보를 사용해 백엔드 세션 재조회 생략
  const loginUser = await getServerLoginUser();

  if (!loginUser) {
    redirect("/login");
  }

  return (
    <main className="page-content flex flex-1 flex-col bg-background pb-[max(2rem,env(safe-area-inset-bottom))] text-foreground">
      {/* 안내 정보 조회 중에는 메인 콘텐츠 스켈레톤 표시 */}
      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeContent loginUser={loginUser} />
      </Suspense>
    </main>
  );
}
