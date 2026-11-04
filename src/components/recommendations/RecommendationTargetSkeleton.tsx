// 추천 대상의 프로필·제목·예산 슬라이더 자리를 표시하는 스켈레톤 (RecommendationTarget과 같은 크기)

export default function RecommendationTargetSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full animate-pulse items-center gap-3 rounded-lg bg-background-subtle p-4"
    >
      <div className="h-14 w-14 shrink-0 rounded-full bg-disabled" />

      <div className="min-w-0 flex-1">
        <div className="flex h-[1lh] items-center text-heading-3">
          <div className="h-4 w-2/3 rounded-sm bg-disabled" />
        </div>

        {/* 첫 목록을 받은 뒤 나타나는 예산 슬라이더(PriceRangeSlider) 높이를 미리 확보함 */}
        <div className="mt-2 min-w-0">
          <div className="flex h-[1lh] items-center justify-between gap-3 text-body-sm">
            <div className="h-3 w-8 rounded-sm bg-disabled" />
            <div className="h-3 w-1/2 rounded-sm bg-disabled" />
          </div>
          <div className="-mt-1 flex h-11 items-center">
            <div className="h-1 w-full rounded-full bg-disabled" />
          </div>
          <div className="-mt-2 flex h-[1lh] items-center justify-between text-caption">
            <div className="h-2.5 w-12 rounded-sm bg-disabled" />
            <div className="h-2.5 w-12 rounded-sm bg-disabled" />
          </div>
        </div>
      </div>
    </div>
  );
}
