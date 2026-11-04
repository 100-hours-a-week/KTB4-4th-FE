// 추천 대상의 프로필·제목·예산 슬라이더 자리를 표시하는 스켈레톤 (RecommendationTarget과 같은 크기)

import PriceRangeSliderSkeleton from "@/components/recommendations/PriceRangeSliderSkeleton";

export default function RecommendationTargetSkeleton() {
  return (
    // 슬라이더 스켈레톤이 자체 애니메이션을 가지므로 겹치지 않도록 바깥 상자 대신 각 자리표시에 적용함
    <div
      aria-hidden="true"
      className="flex w-full items-center gap-3 rounded-lg bg-background-subtle p-4"
    >
      <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-disabled" />

      <div className="min-w-0 flex-1">
        <div className="flex h-[1lh] animate-pulse items-center text-heading-3">
          <div className="h-4 w-2/3 rounded-sm bg-disabled" />
        </div>

        {/* 첫 목록을 받은 뒤 나타나는 예산 슬라이더(PriceRangeSlider) 높이를 미리 확보함 */}
        <PriceRangeSliderSkeleton />
      </div>
    </div>
  );
}
