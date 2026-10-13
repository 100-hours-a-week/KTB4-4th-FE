// 상품과 추천 문맥에 맞는 상세 정보를 표시하는 컴포넌트
"use client";

import { useState } from "react";

import ActionButton from "@/components/common/ActionButton";
import type { ProductDetail, ProductDetailContext } from "@/lib/api/productDetail";

type PersonalProductDetailContentProps = {
  product: ProductDetail;
  context: ProductDetailContext;
};

type RecommendationFeedback = "LIKE" | "DISLIKE";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function PersonalProductDetailContent({
  product,
  context,
}: PersonalProductDetailContentProps) {
  const [feedback, setFeedback] = useState<RecommendationFeedback | null>(null);
  const isFriendGift = context === "FRIEND_GIFT";

  const handlePurchase = () => {
    window.open(product.purchaseUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="flex w-full flex-col gap-3 pt-2">
      <div
        role="img"
        aria-label={`${product.name} 상품 이미지${product.productImageUrl ? "" : " 준비 중"}`}
        className="flex h-64 w-full items-center justify-center rounded-sm bg-disabled bg-cover bg-center bg-no-repeat text-body-sm text-foreground-secondary"
        style={
          product.productImageUrl
            ? { backgroundImage: `url(${JSON.stringify(product.productImageUrl)})` }
            : undefined
        }
      >
        {!product.productImageUrl && "이미지 영역"}
      </div>

      <section
        aria-labelledby="product-name"
        className="rounded-sm border border-border-strong bg-surface px-4 py-4"
      >
        <p className="text-body-sm text-muted">{product.category}</p>
        <h1 id="product-name" className="mt-2 text-heading-2 font-bold text-foreground">
          {product.name}
        </h1>
        {product.description && (
          <p className="mt-2 text-body text-foreground-secondary">{product.description}</p>
        )}
        <p className="mt-4 text-heading-2 font-bold text-foreground">
          {formatPrice(product.price)}
        </p>
      </section>

      <section
        aria-labelledby="recommendation-reason-title"
        className="rounded-sm border border-border-strong bg-surface px-4 py-4"
      >
        <h2 id="recommendation-reason-title" className="text-heading-3 font-bold text-foreground">
          {isFriendGift ? "친구에게 잘 맞는 이유" : "나에게 잘 맞는 이유"}
        </h2>
        <p className="mt-1 text-body text-foreground-secondary">{product.recommendation.reason}</p>
        <ul aria-label="추천 키워드" className="mt-3 flex list-none flex-wrap gap-2 p-0">
          {product.recommendation.matchingKeywords.map((keyword) => (
            <li
              key={keyword}
              className="inline-flex items-center rounded-full border border-brand-400 bg-brand-50 px-3 py-1.5 text-body-sm font-bold text-foreground"
            >
              {keyword}
            </li>
          ))}
        </ul>
      </section>

      {!isFriendGift && (
        <section
          aria-labelledby="recommendation-feedback-title"
          className="rounded-md bg-background-subtle px-4 py-4"
        >
          <h2
            id="recommendation-feedback-title"
            className="text-heading-3 font-bold text-foreground"
          >
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
      )}

      <ActionButton onClick={handlePurchase} className="mt-1 !font-bold">
        구매하러 가기
      </ActionButton>
    </article>
  );
}
