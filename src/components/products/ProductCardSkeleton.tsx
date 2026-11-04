// 상품 카드 1개 자리를 표시하는 스켈레톤 (ProductCard와 같은 크기)

export default function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex w-full min-w-0 animate-pulse flex-col">
      <div className="aspect-square w-full rounded-md bg-background-subtle" />

      <div className="mt-2 min-w-0">
        <div className="flex h-[1lh] items-center text-body-sm">
          <div className="h-3 w-1/3 rounded-sm bg-background-subtle" />
        </div>
        {/* 상품명은 최대 2줄이므로 2줄 높이를 미리 확보함 */}
        <div className="mt-0.5 flex h-[2lh] flex-col justify-around text-body-sm">
          <div className="h-3 w-full rounded-sm bg-background-subtle" />
          <div className="h-3 w-2/3 rounded-sm bg-background-subtle" />
        </div>
        <div className="mt-0.5 flex h-[1lh] items-center text-body">
          <div className="h-3.5 w-1/2 rounded-sm bg-background-subtle" />
        </div>
      </div>
    </div>
  );
}
