// 메인 안내 정보를 받기 전 제목과 설명 자리를 표시하는 스켈레톤 (PageIntro와 같은 크기)

export default function HomeIntroSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse px-1 pt-4">
      <div className="flex h-[30px] items-center">
        <div className="h-6 w-3/4 rounded-sm bg-background-subtle" />
      </div>
      <div className="mt-3 flex h-[1lh] items-center text-body-sm">
        <div className="h-3.5 w-1/2 rounded-sm bg-background-subtle" />
      </div>
    </div>
  );
}
