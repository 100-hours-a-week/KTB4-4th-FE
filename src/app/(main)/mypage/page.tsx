// 사용자의 프로필과 AI 취향 분석 정보를 제공하는 마이페이지

import { redirect } from "next/navigation";

import AiSummarySection from "@/components/common/AiSummarySection";
import KeywordSection from "@/components/common/KeywordSection";
import ProfileSection from "@/components/mypage/ProfileSection";
import { getMyPage } from "@/lib/api/myPage";
import { ServerApiError } from "@/lib/api/serverClient";

async function getMyPageOrRedirect() {
  try {
    return await getMyPage();
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    redirect("/error");
  }
}

export default async function MyPage() {
  const myPageData = await getMyPageOrRedirect();
  const hasTasteKeywords = myPageData.tasteKeywords.length > 0;
  const hasInterestKeywords = myPageData.interestKeywords.length > 0;
  const hasAiSummary = myPageData.aiSummary.trim().length > 0;
  const hasTasteAnalysis = hasTasteKeywords || hasInterestKeywords || hasAiSummary;

  return (
    <main className="page-content flex flex-1 flex-col bg-background pb-[max(2.5rem,env(safe-area-inset-bottom))] text-foreground">
      <ProfileSection profile={myPageData.profile} />

      {hasTasteAnalysis ? (
        <div className="mt-8 flex flex-col gap-8">
          {hasTasteKeywords && (
            <KeywordSection
              category="취향"
              nickname={myPageData.profile.nickname}
              keywords={myPageData.tasteKeywords}
            />
          )}
          {hasInterestKeywords && (
            <KeywordSection
              category="관심사"
              nickname={myPageData.profile.nickname}
              keywords={myPageData.interestKeywords}
            />
          )}
          {hasAiSummary && (
            <AiSummarySection
              nickname={myPageData.profile.nickname}
              summary={myPageData.aiSummary}
            />
          )}
        </div>
      ) : (
        <p className="mt-8 text-body text-foreground-secondary">아직 취향 분석을 하지 않았어요</p>
      )}
    </main>
  );
}
