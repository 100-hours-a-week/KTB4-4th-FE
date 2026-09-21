// 사용자의 취향 데이터에 맞는 콘텐츠를 제공하는 메인 화면
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import EmptyPreferenceHome from "@/components/home/EmptyPreferenceHome";
import PersonalizedHome from "@/components/home/PersonalizedHome";
import { getGuidance, type GuidanceData } from "@/lib/api/guidance";
import { temporaryRecommendedProducts } from "@/mocks/recommendedProducts";

// TODO: 사용자 정보와 취향 분석 상태 API 연동 후 실제 데이터로 교체
const temporaryUser = {
  id: 0,
  name: "수연",
  hasPreferenceData: false,
};

export default function Home() {
  const router = useRouter();
  const [guidanceData, setGuidanceData] = useState<GuidanceData | null>(null);

  useEffect(() => {
    if (!temporaryUser.hasPreferenceData) return;

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
      {/* TODO: 취향 분석 상태 API 연동 후 실제 데이터로 메인 콘텐츠 분기 */}
      {temporaryUser.hasPreferenceData && guidanceData ? (
        <PersonalizedHome
          userId={temporaryUser.id}
          userName={temporaryUser.name}
          title={guidanceData.guidance.title}
          description={guidanceData.guidance.description}
          products={temporaryRecommendedProducts}
        />
      ) : !temporaryUser.hasPreferenceData ? (
        <EmptyPreferenceHome />
      ) : null}
    </main>
  );
}
