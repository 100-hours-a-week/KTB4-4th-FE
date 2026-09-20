// 취향 데이터가 있는 사용자의 메인 페이지 콘텐츠

import Link from "next/link";

import PageIntro from "@/components/common/PageIntro";
import HomeProductCard from "@/components/home/HomeProductCard";
import type { RecommendedProduct } from "@/types/product";

type PersonalizedHomeProps = {
  userId: number;
  userName: string;
  birthdayDaysRemaining: number;
  products: RecommendedProduct[];
};

export default function PersonalizedHome({
  userId,
  userName,
  birthdayDaysRemaining,
  products,
}: PersonalizedHomeProps) {
  return (
    <>
      {/* TODO: 사용자 API의 이름과 생일 정보를 기준으로 PageIntro 문구 교체 */}
      <PageIntro
        title={`${userName}님의 생일이 ${birthdayDaysRemaining}일 남았어요.`}
        description="마음을 전할 선물을 미리 준비해 볼까요?"
      />

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

        {/* TODO: 상품 추천 API 응답으로 메인 페이지 맞춤 상품 목록 교체 */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {products.slice(0, 3).map((product) => (
            <HomeProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
