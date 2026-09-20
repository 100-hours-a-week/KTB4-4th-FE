// 조건에 맞는 추천 상품이 없을 때 표시하는 빈 상태 컴포넌트

export default function EmptyRecommendedProducts() {
  return (
    <div
      role="status"
      className="flex min-h-[220px] w-full flex-col items-center justify-center px-4 text-center"
    >
      <h2 className="text-[20px] leading-7 font-bold text-foreground">
        조건에 맞는 추천 상품이 없어요
      </h2>
      <p className="mt-5 text-body leading-6 text-muted">
        예산 범위를 넓히거나
        <br />
        취향 조건을 줄여보세요
      </p>
    </div>
  );
}
