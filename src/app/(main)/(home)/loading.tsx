// 메인 화면으로 이동하는 동안 표시하는 스켈레톤 로딩 화면 (라우트 그룹으로 다른 하위 경로에는 적용되지 않음)

import HomeContentSkeleton from "@/components/home/HomeContentSkeleton";

export default function HomeLoading() {
  return (
    <main className="page-content flex flex-1 flex-col bg-background pb-[max(2rem,env(safe-area-inset-bottom))] text-foreground">
      <HomeContentSkeleton />
    </main>
  );
}
