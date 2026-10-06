// 사용자의 프로필과 AI 취향 분석 정보를 제공하는 마이페이지

import AiSummarySection from "@/components/mypage/AiSummarySection";
import KeywordSection from "@/components/mypage/KeywordSection";
import ProfileSection from "@/components/mypage/ProfileSection";
import { myPageMock } from "@/mocks/mypage";

export default function MyPage() {
  return (
    <main className="page-content flex flex-1 flex-col bg-background pb-[max(2.5rem,env(safe-area-inset-bottom))] text-foreground">
      <ProfileSection profile={myPageMock.profile} />

      <div className="mt-8 flex flex-col gap-8">
        <KeywordSection
          category="취향"
          nickname={myPageMock.profile.nickname}
          keywords={myPageMock.tasteKeywords}
        />
        <KeywordSection
          category="관심사"
          nickname={myPageMock.profile.nickname}
          keywords={myPageMock.interestKeywords}
        />
        <AiSummarySection nickname={myPageMock.profile.nickname} summary={myPageMock.aiSummary} />
      </div>
    </main>
  );
}
