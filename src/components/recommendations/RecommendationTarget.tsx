// 상품 추천 대상의 프로필과 추천 맥락을 표시하는 컴포넌트

import PriceRangeSlider from "@/components/recommendations/PriceRangeSlider";
import type { RecommendationTarget as RecommendationTargetData } from "@/types/recommendation";

type RecommendationTargetProps = {
  target: RecommendationTargetData;
  availableMinPrice: number;
  availableMaxPrice: number;
};

export default function RecommendationTarget({
  target,
  availableMinPrice,
  availableMaxPrice,
}: RecommendationTargetProps) {
  const recommendationTitle =
    target.type === "SELF" ? (
      "나를 위한 추천"
    ) : (
      <span className="flex min-w-0 items-center whitespace-nowrap">
        <span className="min-w-0 truncate text-[#4684e9]">{target.name}</span>
        <span className="shrink-0">&nbsp;님을 위한 추천 상품</span>
      </span>
    );

  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-border-strong bg-surface p-4">
      {/* TODO: 추천 API의 profileImageUrl이 있으면 추천 대상의 프로필 이미지로 교체 */}
      <div
        role="img"
        aria-label={`${target.name} 프로필 이미지`}
        className="h-14 w-14 shrink-0 rounded-full bg-background-subtle"
      />

      <div className="min-w-0 flex-1">
        {/* TODO: 추천 API의 취향·관심사 키워드를 상품 추천 요청에 활용 */}
        <h1 className="min-w-0 text-heading-3 font-bold text-foreground">{recommendationTitle}</h1>
        <PriceRangeSlider
          availableMinPrice={availableMinPrice}
          availableMaxPrice={availableMaxPrice}
        />
      </div>
    </div>
  );
}
