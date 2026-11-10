// 추천 대상의 문맥에 맞는 상품 추천 화면

import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import FriendRecommendationContent from "@/components/products/FriendRecommendationContent";
import PersonalRecommendationsContent from "@/components/products/PersonalRecommendationsContent";
import { getServerPersonalRecommendationsFirstPage } from "@/lib/api/personalRecommendationsServer";
import { getProductCategories } from "@/lib/api/productCategories";
import { ServerApiError } from "@/lib/api/serverClient";
import { getServerLoginUser } from "@/lib/api/serverSession";
import {
  getPersonalRecommendationsNextPageParam,
  getPersonalRecommendationsQueryKey,
  PERSONAL_RECOMMENDATIONS_INITIAL_PAGE_PARAM,
} from "@/lib/personalRecommendationsQuery";
import { ALL_PRODUCT_CATEGORY_CODE, type ProductCategory } from "@/lib/productCategories";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "상품 추천",
};

type ProductsPageProps = {
  searchParams: Promise<{
    targetType?: string;
    targetUserId?: string;
    tab?: string;
  }>;
};

async function getProductCategoriesOrRedirect(): Promise<ProductCategory[]> {
  try {
    const categories = await getProductCategories();

    return [{ code: ALL_PRODUCT_CATEGORY_CODE, name: "전체" }, ...categories];
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    redirect("/error");
  }
}

// 첫 화면 이미지 요청을 앞당기기 위해 조건 없는 내 추천 첫 페이지를 서버에서 미리 조회함
async function prefetchInitialPersonalRecommendations(queryClient: QueryClient) {
  try {
    await queryClient.fetchInfiniteQuery({
      queryKey: getPersonalRecommendationsQueryKey({}),
      queryFn: getServerPersonalRecommendationsFirstPage,
      initialPageParam: PERSONAL_RECOMMENDATIONS_INITIAL_PAGE_PARAM,
      getNextPageParam: getPersonalRecommendationsNextPageParam,
    });
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    // 그 외 오류는 선조회 결과 없이 렌더링해 클라이언트에서 다시 조회하도록 둠
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { targetType, targetUserId, tab } = await searchParams;

  if (targetType === "FRIEND") {
    const userId = Number(targetUserId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      redirect("/error");
    }

    const categories = await getProductCategoriesOrRedirect();

    return (
      <main
        aria-label="상품 추천"
        className="page-content flex flex-1 flex-col bg-background pb-[calc(var(--spacing-bottom-nav-overlap)+var(--spacing-page))]"
      >
        <FriendRecommendationContent userId={userId} categories={categories} />
      </main>
    );
  }

  // proxy가 검증한 세션 정보를 사용해 클라이언트의 로그인 확인 대기 생략
  const loginUser = await getServerLoginUser();

  if (!loginUser) {
    redirect("/login");
  }

  const queryClient = new QueryClient();
  // 친구에게 보여지는 상품 탭은 다른 목록을 사용하므로 내 추천 탭으로 진입할 때만 선조회함
  const [categories] = await Promise.all([
    getProductCategoriesOrRedirect(),
    tab === "shared" ? undefined : prefetchInitialPersonalRecommendations(queryClient),
  ]);

  return (
    <main
      aria-label="상품 추천"
      className="page-content flex flex-1 flex-col bg-background pb-[calc(var(--spacing-bottom-nav-overlap)+var(--spacing-page))]"
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PersonalRecommendationsContent loginUser={loginUser} categories={categories} />
      </HydrationBoundary>
    </main>
  );
}
