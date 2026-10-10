// 추천 대상의 문맥에 맞는 상품 추천 화면

import { redirect } from "next/navigation";

import FriendRecommendationContent from "@/components/products/FriendRecommendationContent";
import PersonalRecommendationsContent from "@/components/products/PersonalRecommendationsContent";

type ProductsPageProps = {
  searchParams: Promise<{
    targetType?: string;
    targetUserId?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { targetType, targetUserId } = await searchParams;

  if (targetType === "FRIEND") {
    const userId = Number(targetUserId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      redirect("/error");
    }

    return (
      <main aria-label="상품 추천" className="page-content flex flex-1 flex-col bg-background">
        <FriendRecommendationContent userId={userId} />
      </main>
    );
  }

  return (
    <main aria-label="상품 추천" className="page-content flex flex-1 flex-col bg-background">
      <PersonalRecommendationsContent />
    </main>
  );
}
