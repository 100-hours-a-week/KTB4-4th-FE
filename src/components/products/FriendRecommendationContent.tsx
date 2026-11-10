// 친구 정보 요약을 조회하고 친구 대상 상품 추천 화면을 구성하는 컴포넌트
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import FriendGiftRecommendationsContent from "@/components/products/FriendGiftRecommendationsContent";
import FriendTasteAnalysisRequired from "@/components/products/FriendTasteAnalysisRequired";
import ProductCategoryBadgesSkeleton from "@/components/products/ProductCategoryBadgesSkeleton";
import ProductGridSkeleton from "@/components/products/ProductGridSkeleton";
import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import RecommendationTargetSkeleton from "@/components/recommendations/RecommendationTargetSkeleton";
import { ApiRequestError } from "@/lib/api/client";
import { getFriendDetail, type FriendDetail } from "@/lib/api/friends";
import type { ProductCategory } from "@/lib/productCategories";
import type { RecommendationTarget as RecommendationTargetData } from "@/types/recommendation";

type FriendRecommendationContentProps = {
  userId: number;
  categories: readonly ProductCategory[];
};

export default function FriendRecommendationContent({
  userId,
  categories,
}: FriendRecommendationContentProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<FriendDetail | null>(null);
  const isMountedRef = useRef(false);
  const requestedUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    const loadFriend = async () => {
      try {
        const data = await getFriendDetail(userId);

        if (isMountedRef.current && requestedUserIdRef.current === userId) {
          setFriend(data);
        }
      } catch (error) {
        if (isMountedRef.current && requestedUserIdRef.current === userId) {
          router.replace(
            error instanceof ApiRequestError && error.status === 401 ? "/login" : "/error",
          );
        }
      }
    };

    if (requestedUserIdRef.current !== userId) {
      requestedUserIdRef.current = userId;
      setFriend(null);
      void loadFriend();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [router, userId]);

  // 이동 중 로딩 화면(loading.tsx)과 같은 배치로 표시해 친구 정보를 받는 동안 화면이 바뀌지 않게 함
  // TODO: 친구 정보 서버 선조회 적용 시 이 대기 화면 제거
  if (!friend) {
    return (
      <>
        <p role="status" className="sr-only">
          친구 정보를 불러오는 중이에요.
        </p>
        <section aria-hidden="true" className="w-full pt-8">
          <RecommendationTargetSkeleton />
        </section>
        <section aria-hidden="true" className="flex w-full flex-col gap-4 py-5">
          <ProductCategoryBadgesSkeleton />
          <ProductGridSkeleton />
        </section>
      </>
    );
  }

  const target = {
    type: "FRIEND",
    userId: friend.id,
    name: friend.nickname,
    profileImageUrl: friend.profileImageUrl,
    tasteKeywords: [],
    interestKeywords: [],
  } satisfies RecommendationTargetData;

  if (friend.tasteAnalysisCompleted) {
    return (
      <FriendGiftRecommendationsContent
        key={target.userId}
        target={target}
        categories={categories}
      />
    );
  }

  return (
    <>
      <section aria-label="추천 대상" className="w-full pt-8">
        <RecommendationTarget target={target} showBudget={false} />
      </section>

      <section aria-label="추천 상품 목록" className="flex w-full flex-col gap-4 py-5">
        <FriendTasteAnalysisRequired />
      </section>
    </>
  );
}
