// 예산 슬라이더 자리를 표시하는 스켈레톤 (PriceRangeSlider와 같은 크기, 추천 대상 영역의 회색 배경 위에서 사용)

export default function PriceRangeSliderSkeleton() {
  return (
    <div aria-hidden="true" className="mt-2 min-w-0 animate-pulse">
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
  );
}
