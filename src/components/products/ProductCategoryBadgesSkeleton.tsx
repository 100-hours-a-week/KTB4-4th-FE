// 상품 카테고리 탭 줄 자리를 표시하는 스켈레톤 (ProductCategoryBadges와 같은 높이)

const BADGE_WIDTH_CLASS_NAMES = ["w-8", "w-12", "w-10", "w-14", "w-10", "w-12"];

export default function ProductCategoryBadgesSkeleton() {
  return (
    <div aria-hidden="true" className="-mr-page animate-pulse overflow-hidden">
      <div className="flex gap-5 pr-page">
        {BADGE_WIDTH_CLASS_NAMES.map((widthClassName, index) => (
          <div key={index} className="flex h-[1lh] shrink-0 items-center px-0.5 text-body-lg">
            <div className={`h-4 rounded-sm bg-background-subtle ${widthClassName}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
