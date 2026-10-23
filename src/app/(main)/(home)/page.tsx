// 사용자의 취향 데이터에 맞는 콘텐츠를 서버에서 조회해 제공하는 메인 화면

import { redirect } from "next/navigation";

import EmptyPreferenceHome from "@/components/home/EmptyPreferenceHome";
import PersonalizedHome from "@/components/home/PersonalizedHome";
import { getHomeGuidance, getHomeRecommendations } from "@/lib/api/homeServer";
import { ServerApiError } from "@/lib/api/serverClient";
import { getServerLoginUser } from "@/lib/api/serverSession";

async function getHomeDataOrRedirect() {
  // proxy가 검증한 세션 정보를 사용해 백엔드 세션 재조회 생략
  const loginUser = await getServerLoginUser();

  if (!loginUser) {
    redirect("/login");
  }

  try {
    const guidance = await getHomeGuidance();
    // 취향 분석을 마친 사용자만 추천 상품 조회
    const products = guidance.tasteAnalysisCompleted ? await getHomeRecommendations() : [];

    return { loginUser, guidance, products };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    redirect("/error");
  }
}

export default async function Home() {
  const { loginUser, guidance, products } = await getHomeDataOrRedirect();

  return (
    <main className="page-content flex flex-1 flex-col bg-background pb-[max(2rem,env(safe-area-inset-bottom))] text-foreground">
      {guidance.tasteAnalysisCompleted ? (
        <PersonalizedHome
          userId={loginUser.id}
          userName={loginUser.nickname}
          title={guidance.guidance.title}
          description={guidance.guidance.description}
          products={products}
        />
      ) : (
        <EmptyPreferenceHome
          title={guidance.guidance.title}
          description={guidance.guidance.description}
        />
      )}
    </main>
  );
}
