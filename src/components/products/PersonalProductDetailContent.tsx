// 내 추천 상품의 상세 정보와 추천 만족도 선택 UI
"use client";

import { useState } from "react";

import ActionButton from "@/components/common/ActionButton";

type PersonalProductDetailContentProps = {
  recommendationId: number;
};

type RecommendationFeedback = "LIKE" | "DISLIKE";

// TODO: 사용자 정보를 props로 전달받도록 변경 후 실제 사용자 이름으로 교체
const TEMPORARY_USER_NAME = "수연";

// TODO: 상품 상세 API 연동 후 recommendationId로 조회한 실제 응답 데이터로 교체
const getTemporaryProductDetail = (recommendationId: number) => ({
  recommendationId,
  category: "카카오톡 선물하기",
  name: "오브제 세라믹 드리퍼",
  price: 48_000,
  reason: "홈카페를 즐기고 군더더기 없는 무채색을 선호해요.",
  matchingKeywords: ["홈카페", "미니멀"],
});

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function PersonalProductDetailContent({
  recommendationId,
}: PersonalProductDetailContentProps) {
  const [feedback, setFeedback] = useState<RecommendationFeedback | null>(null);
  const product = getTemporaryProductDetail(recommendationId);

  const handlePurchase = () => {
    // TODO: 상품 상세 API의 구매 URL을 사용해 외부 상품 상세 페이지로 이동
  };

  return (
    <article className="flex w-full flex-col gap-3 pt-2">
      {/* TODO: 상품 상세 API 연동 후 실제 상품 이미지로 교체 */}
      <div
        role="img"
        aria-label={`${product.name} 상품 이미지 준비 중`}
        className="flex h-64 w-full items-center justify-center rounded-sm bg-disabled text-body-sm text-foreground-secondary"
      >
        이미지 영역
      </div>

      <section
        aria-labelledby="product-name"
        className="rounded-sm border border-border-strong bg-surface px-4 py-4"
      >
        <p className="text-body-sm text-muted">{product.category}</p>
        <h1 id="product-name" className="mt-2 text-heading-2 font-bold text-foreground">
          {product.name}
        </h1>
        <p className="mt-4 text-heading-2 font-bold text-foreground">
          {formatPrice(product.price)}
        </p>
      </section>

      <section
        aria-labelledby="recommendation-reason-title"
        className="rounded-sm border border-border-strong bg-surface px-4 py-4"
      >
        <h2 id="recommendation-reason-title" className="text-heading-3 font-bold text-foreground">
          <span className="text-info">{TEMPORARY_USER_NAME}</span> 님에게 잘 맞는 이유
        </h2>
        <p className="mt-1 text-body text-foreground-secondary">{product.reason}</p>
        <ul aria-label="추천 키워드" className="mt-3 flex list-none flex-wrap gap-2 p-0">
          {product.matchingKeywords.map((keyword) => (
            <li
              key={keyword}
              className="rounded-full border border-brand-100 bg-warning-subtle px-3 py-1 text-caption font-bold text-foreground-secondary"
            >
              {keyword}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="recommendation-feedback-title"
        className="rounded-md bg-background-subtle px-4 py-4"
      >
        <h2 id="recommendation-feedback-title" className="text-heading-3 font-bold text-foreground">
          이 추천은 어떤가요?
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={feedback === "LIKE"}
            onClick={() => setFeedback("LIKE")}
            className="rounded-sm border-0 bg-foreground px-3 py-2 text-body !font-bold text-background"
          >
            마음에 들어요
          </button>
          <button
            type="button"
            aria-pressed={feedback === "DISLIKE"}
            onClick={() => setFeedback("DISLIKE")}
            className="rounded-sm border-0 bg-disabled px-3 py-2 text-body !font-bold text-foreground"
          >
            별로예요
          </button>
        </div>
      </section>

      <ActionButton onClick={handlePurchase} className="mt-1 !font-bold">
        구매하러 가기
      </ActionButton>
    </article>
  );
}
