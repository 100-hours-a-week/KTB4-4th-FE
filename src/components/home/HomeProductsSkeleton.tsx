// 메인 맞춤 상품을 받기 전 제목과 상품 카드 3개 자리를 표시하는 스켈레톤 (HomeProducts와 같은 크기)

const SKELETON_COUNT = 3;

export default function HomeProductsSkeleton() {
  return (
    <div aria-hidden="true" className="mt-8 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-[1lh] min-w-0 flex-1 items-center text-heading-3">
          <div className="h-4 w-1/2 rounded-sm bg-background-subtle" />
        </div>
        <div className="shrink-0 rounded-sm bg-background-subtle px-2 py-0.5 text-body-sm">
          <div className="h-[1lh] w-7" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div
            key={index}
            className="min-w-0 rounded-sm border border-border-strong bg-surface p-2"
          >
            <div className="aspect-square w-full bg-background-subtle" />
            <div className="mt-3 flex h-[1lh] items-center text-body-sm">
              <div className="h-3 w-full rounded-sm bg-background-subtle" />
            </div>
            <div className="mt-1 flex h-[1lh] items-center text-body">
              <div className="h-3.5 w-2/3 rounded-sm bg-background-subtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
