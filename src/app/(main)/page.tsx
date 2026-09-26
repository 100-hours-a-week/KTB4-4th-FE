// 사용자의 취향 데이터에 맞는 콘텐츠를 제공하는 메인 화면
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import EmptyPreferenceHome from "@/components/home/EmptyPreferenceHome";
import PersonalizedHome from "@/components/home/PersonalizedHome";
import { getGuidance, type GuidanceData } from "@/lib/api/guidance";
import { checkLoginValidity, type LoginValidityData } from "@/lib/api/loginValidity";

interface HomeData {
  guidance: GuidanceData;
  loginValidity: LoginValidityData;
}

export default function Home() {
  const router = useRouter();
  const [homeData, setHomeData] = useState<HomeData | null>(null);

  useEffect(() => {
    let isActive = true;

    Promise.all([getGuidance(), checkLoginValidity()])
      .then(([guidance, loginValidity]) => {
        if (isActive) {
          setHomeData({ guidance, loginValidity });
        }
      })
      .catch(() => {
        if (isActive) {
          router.replace("/error");
        }
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <main className="page-content flex flex-1 flex-col bg-background pb-[max(2rem,env(safe-area-inset-bottom))] text-foreground">
      {homeData ? (
        homeData.guidance.tasteAnalysisCompleted ? (
          <PersonalizedHome
            userId={homeData.loginValidity.user.id}
            userName={homeData.loginValidity.user.nickname}
            title={homeData.guidance.guidance.title}
            description={homeData.guidance.guidance.description}
          />
        ) : (
          <EmptyPreferenceHome
            title={homeData.guidance.guidance.title}
            description={homeData.guidance.guidance.description}
          />
        )
      ) : null}
    </main>
  );
}
