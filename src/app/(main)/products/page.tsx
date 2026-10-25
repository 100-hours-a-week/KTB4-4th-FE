// 추천 대상의 문맥에 맞는 상품 추천 화면

import { redirect } from "next/navigation";

import FriendRecommendationContent from "@/components/products/FriendRecommendationContent";
import PersonalRecommendationsContent from "@/components/products/PersonalRecommendationsContent";
import { getProductCategories } from "@/lib/api/productCategories";
import { ServerApiError } from "@/lib/api/serverClient";
import { ALL_PRODUCT_CATEGORY_CODE, type ProductCategory } from "@/lib/productCategories";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "상품 추천",
};

type ProductsPageProps = {
  searchParams: Promise<{
    targetType?: string;
    targetUserId?: string;
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { targetType, targetUserId } = await searchParams;

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

  const categories = await getProductCategoriesOrRedirect();

  return (
    <main
      aria-label="상품 추천"
      className="page-content flex flex-1 flex-col bg-background pb-[calc(var(--spacing-bottom-nav-overlap)+var(--spacing-page))]"
    >
      <PersonalRecommendationsContent categories={categories} />
    </main>
  );
}
