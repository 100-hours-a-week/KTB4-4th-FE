// 친구 정보 요약을 조회하고 친구 대상 상품 추천 화면을 구성하는 컴포넌트
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import EmptyRecommendedProducts from "@/components/products/EmptyRecommendedProducts";
import FriendTasteAnalysisRequired from "@/components/products/FriendTasteAnalysisRequired";
import ProductCard from "@/components/products/ProductCard";
import RecommendationTarget from "@/components/recommendations/RecommendationTarget";
import { ApiRequestError } from "@/lib/api/client";
import { getFriendDetail, type FriendDetail } from "@/lib/api/friends";
import { temporaryRecommendedProducts } from "@/mocks/recommendedProducts";
import type { RecommendationTarget as RecommendationTargetData } from "@/types/recommendation";

type FriendRecommendationContentProps = {
  userId: number;
  availableMinPrice: number;
  availableMaxPrice: number;
};

export default function FriendRecommendationContent({
  userId,
  availableMinPrice,
  availableMaxPrice,
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

  if (!friend) {
    return (
      <p role="status" className="pt-8 text-center text-body-sm text-muted">
        친구 정보를 불러오는 중이에요.
      </p>
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

  return (
    <>
      <section aria-label="추천 대상" className="w-full pt-8">
        <RecommendationTarget
          target={target}
          availableMinPrice={availableMinPrice}
          availableMaxPrice={availableMaxPrice}
          showBudget={friend.tasteAnalysisCompleted}
        />
      </section>

      {/* TODO: 친구 추천 상품 목록 조회 API 연동 후 Mock 데이터 교체 */}
      <section aria-label="추천 상품 목록" className="flex w-full flex-col gap-4 py-5">
        {!friend.tasteAnalysisCompleted ? (
          <FriendTasteAnalysisRequired />
        ) : temporaryRecommendedProducts.length === 0 ? (
          <EmptyRecommendedProducts />
        ) : (
          temporaryRecommendedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </section>
    </>
  );
}
