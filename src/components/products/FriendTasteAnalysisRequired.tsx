// 친구의 취향 분석이 완료되지 않았을 때 표시하는 안내 컴포넌트

export default function FriendTasteAnalysisRequired() {
  return (
    <div
      role="status"
      className="flex min-h-[220px] w-full flex-col items-center justify-center px-4 text-center"
    >
      <h2 className="text-[18px] leading-7 font-bold text-foreground">
        아직 친구의 취향 분석이 완료되지 않았어요
      </h2>
      <p className="mt-5 text-body leading-6 text-muted">
        친구가 니쥬와 대화를 완료하면
        <br />
        추천 상품을 확인할 수 있어요.
      </p>
    </div>
  );
}
