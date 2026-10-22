// 취향 데이터가 있는 사용자의 메인 페이지 콘텐츠
"use client";

import Link from "next/link";

import PageIntro from "@/components/common/PageIntro";
import HomeProductCard from "@/components/home/HomeProductCard";
import type { PersonalRecommendation } from "@/lib/api/personalRecommendations";

type PersonalizedHomeProps = {
  userId: number;
  userName: string;
  title: string;
  description: string;
  products: PersonalRecommendation[];
};

export default function PersonalizedHome({
  userId,
  userName,
  title,
  description,
  products,
}: PersonalizedHomeProps) {
  return (
    <>
      <PageIntro title={title} description={description} />

      {products.length === 0 ? (
        <div
          role="status"
          className="mt-8 flex min-h-20 items-center justify-center rounded-sm bg-background-subtle px-4 text-center"
        >
          <p className="text-body text-muted">현재 추천 상품이 없어요</p>
        </div>
      ) : (
        <section aria-labelledby="personalized-products-title" className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="personalized-products-title"
              className="flex min-w-0 items-center text-heading-3 font-bold whitespace-nowrap text-foreground"
            >
              <span className="min-w-0 truncate text-[#4684e9]">{userName}</span>
              <span className="shrink-0">님을 위한 맞춤 상품</span>
            </h2>
            <Link
              href={`/products?targetType=SELF&targetUserId=${userId}`}
              className="shrink-0 rounded-sm bg-background-subtle px-2 py-0.5 text-body-sm text-foreground-secondary"
            >
              더보기
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {products.map((product) => (
              <HomeProductCard key={product.recommendationId} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
