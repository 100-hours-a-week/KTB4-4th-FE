// 메인 캘린더를 표시하기 전 연월 제목과 6주 달력 자리를 표시하는 스켈레톤 (MainCalendar와 같은 크기)

export default function HomeCalendarSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse bg-surface">
      <div className="touch-target flex items-center justify-between">
        <div className="h-6 w-28 rounded-sm bg-background-subtle" />
        <div className="h-6 w-6 rounded-full bg-background-subtle" />
      </div>

      <div className="mt-2 border-b border-border pb-2">
        <div className="flex h-[1lh] items-center text-body-sm">
          <div className="h-3 w-full rounded-sm bg-background-subtle" />
        </div>
      </div>

      {/* 6주 고정 달력의 날짜 칸(주당 h-16) 영역 */}
      <div className="h-96 rounded-sm bg-background-subtle" />
    </div>
  );
}
