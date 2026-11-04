// 상품 공개 범위 탭(내 추천·친구에게 보여지는 상품) 자리를 표시하는 스켈레톤 (pill형 SegmentedTabs와 같은 크기)

const TAB_COUNT = 2;

type ProductVisibilityTabsSkeletonProps = {
  className?: string;
};

export default function ProductVisibilityTabsSkeleton({
  className = "",
}: ProductVisibilityTabsSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex w-full animate-pulse rounded-full bg-background-subtle p-1 ${className}`}
    >
      {Array.from({ length: TAB_COUNT }, (_, index) => (
        <div key={index} className="flex min-w-0 flex-1 justify-center px-3 py-2.5">
          <div className="flex h-[1lh] w-full items-center justify-center text-body">
            <div className="h-3 w-3/4 rounded-sm bg-disabled" />
          </div>
        </div>
      ))}
    </div>
  );
}
