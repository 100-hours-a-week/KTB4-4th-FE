// 친구 목록 첫 페이지 로딩 중 카드 자리를 표시하는 스켈레톤

export default function FriendCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex min-h-12 animate-pulse items-center gap-1 bg-surface">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-[35%] bg-background-subtle" />
        <div className="min-w-0 flex-1">
          <div className="flex h-6 items-center">
            <div className="h-4 w-24 rounded-sm bg-background-subtle" />
          </div>
          <div className="mt-0.5 h-3.5 w-20 rounded-sm bg-background-subtle" />
        </div>
      </div>
      <div className="touch-target mr-2 flex shrink-0 items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-background-subtle" />
      </div>
    </div>
  );
}
