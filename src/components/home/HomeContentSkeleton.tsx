// 메인 안내 정보를 받기 전 안내 문구, 맞춤 상품, 캘린더 자리를 표시하는 메인 콘텐츠 스켈레톤

import HomeCalendarSkeleton from "@/components/home/HomeCalendarSkeleton";
import HomeIntroSkeleton from "@/components/home/HomeIntroSkeleton";
import HomeProductsSkeleton from "@/components/home/HomeProductsSkeleton";

export default function HomeContentSkeleton() {
  return (
    <div aria-busy="true">
      <HomeIntroSkeleton />

      {/* 가장 흔한 취향 분석 완료 화면 기준으로, 안내 정보 도착 후 상품 스켈레톤으로 바뀌어도 크기 유지 */}
      <HomeProductsSkeleton />

      <div className="mt-8">
        <HomeCalendarSkeleton />
      </div>

      <p role="status" className="sr-only">
        메인 정보를 불러오는 중이에요.
      </p>
    </div>
  );
}
