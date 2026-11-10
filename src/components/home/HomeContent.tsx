// 메인 안내 정보를 서버에서 조회해 취향 분석 여부에 맞는 메인 콘텐츠를 표시하는 영역

import { Suspense } from "react";

import EmptyPreferenceHome from "@/components/home/EmptyPreferenceHome";
import HomeProducts from "@/components/home/HomeProducts";
import HomeProductsSkeleton from "@/components/home/HomeProductsSkeleton";
import PersonalizedHome from "@/components/home/PersonalizedHome";
import { getHomeGuidance, redirectOnHomeDataError } from "@/lib/api/homeServer";
import type { LoginUser } from "@/lib/api/loginSession";

type HomeContentProps = {
  loginUser: LoginUser;
};

async function getHomeGuidanceOrRedirect() {
  try {
    return await getHomeGuidance();
  } catch (error) {
    redirectOnHomeDataError(error);
  }
}

export default async function HomeContent({ loginUser }: HomeContentProps) {
  const { tasteAnalysisCompleted, guidance } = await getHomeGuidanceOrRedirect();

  if (!tasteAnalysisCompleted) {
    return <EmptyPreferenceHome title={guidance.title} description={guidance.description} />;
  }

  return (
    <PersonalizedHome
      title={guidance.title}
      description={guidance.description}
      // 취향 분석을 마친 사용자만 추천 상품 조회, 조회 중에는 안내 문구를 먼저 표시하고 상품 자리는 스켈레톤 표시
      products={
        <Suspense fallback={<HomeProductsSkeleton />}>
          <HomeProducts userId={loginUser.id} userName={loginUser.nickname} />
        </Suspense>
      }
    />
  );
}
