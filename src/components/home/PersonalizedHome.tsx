// 취향 데이터가 있는 사용자의 메인 페이지 콘텐츠
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PageIntro from "@/components/common/PageIntro";
import HomeProductCard from "@/components/home/HomeProductCard";
import {
  getPersonalRecommendations,
  type PersonalRecommendation,
} from "@/lib/api/personalRecommendations";

type PersonalizedHomeProps = {
  userId: number;
  userName: string;
  title: string;
  description: string;
};

export default function PersonalizedHome({
  userId,
  userName,
  title,
  description,
}: PersonalizedHomeProps) {
  const router = useRouter();
  const [products, setProducts] = useState<PersonalRecommendation[] | null>(null);

  useEffect(() => {
    let isActive = true;

    getPersonalRecommendations({ size: 3 })
      .then((data) => {
        if (isActive) {
          setProducts(data.items);
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
    <>
      <PageIntro title={title} description={description} />

      {products !== null &&
        (products.length === 0 ? (
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
                className="min-w-0 text-heading-3 font-bold text-foreground"
              >
                <span className="text-[#4684e9]">{userName}</span>님을 위한 맞춤 상품
              </h2>
              <Link
                href={`/products?targetType=SELF&targetUserId=${userId}`}
                className="shrink-0 text-body-sm text-foreground-secondary"
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
        ))}
    </>
  );
}
