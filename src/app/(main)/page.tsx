// 사용자의 취향 데이터에 맞는 콘텐츠를 제공하는 메인 화면
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import EmptyPreferenceHome from "@/components/home/EmptyPreferenceHome";
import PersonalizedHome from "@/components/home/PersonalizedHome";
import { getGuidance, type GuidanceData } from "@/lib/api/guidance";

// TODO: 사용자 정보 API 연동 후 실제 데이터로 교체
const temporaryUser = {
  id: 0,
  name: "수연",
};

export default function Home() {
  const router = useRouter();
  const [guidanceData, setGuidanceData] = useState<GuidanceData | null>(null);

  useEffect(() => {
    let isActive = true;

    getGuidance()
      .then((data) => {
        if (isActive) {
          setGuidanceData(data);
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
      {guidanceData ? (
        guidanceData.tasteAnalysisCompleted ? (
          <PersonalizedHome
            userId={temporaryUser.id}
            userName={temporaryUser.name}
            title={guidanceData.guidance.title}
            description={guidanceData.guidance.description}
          />
        ) : (
          <EmptyPreferenceHome
            title={guidanceData.guidance.title}
            description={guidanceData.guidance.description}
          />
        )
      ) : null}
    </main>
  );
}
