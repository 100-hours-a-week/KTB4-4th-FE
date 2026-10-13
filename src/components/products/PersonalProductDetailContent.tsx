// 상품과 추천 문맥에 맞는 상세 정보를 표시하는 컴포넌트
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ActionButton from "@/components/common/ActionButton";
import Modal from "@/components/common/Modal";
import { ApiRequestError } from "@/lib/api/client";
import type { ProductDetail, ProductDetailContext } from "@/lib/api/productDetail";
import { saveProductFeedback } from "@/lib/api/productFeedback";

type PersonalProductDetailContentProps = {
  product: ProductDetail;
  context: ProductDetailContext;
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

const getFeedbackErrorMessage = (error: unknown) => {
  if (!(error instanceof ApiRequestError)) {
    return "선물 만족도를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (error.status === 429 && error.retryAfterSeconds !== undefined) {
    return `${error.message} ${error.retryAfterSeconds}초 후 다시 시도해 주세요.`;
  }

  return error.message;
};

export default function PersonalProductDetailContent({
  product,
  context,
}: PersonalProductDetailContentProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(product.myFeedback);
  const [isDislikeModalOpen, setIsDislikeModalOpen] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackErrorMessage, setFeedbackErrorMessage] = useState("");
  const isFriendGift = context === "FRIEND_GIFT";

  const handlePurchase = () => {
    window.open(product.purchaseUrl, "_blank", "noopener,noreferrer");
  };

  const handleLike = async () => {
    if (isFriendGift || isSubmittingFeedback || feedback === "DISLIKE") {
      return;
    }

    const previousFeedback = feedback;
    setFeedback("LIKE");
    setIsSubmittingFeedback(true);
    setFeedbackErrorMessage("");

    try {
      const savedFeedback = await saveProductFeedback(product.productId, {
        context,
        feedback: "LIKE",
      });
      setFeedback(savedFeedback.feedback);
    } catch (error) {
      setFeedback(previousFeedback);

      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setFeedbackErrorMessage(getFeedbackErrorMessage(error));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const closeDislikeModal = () => {
    if (!isSubmittingFeedback) {
      setIsDislikeModalOpen(false);
      setFeedbackErrorMessage("");
    }
  };

  const handleDislikeConfirm = async () => {
    if (isFriendGift || isSubmittingFeedback) {
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackErrorMessage("");

    try {
      await saveProductFeedback(product.productId, {
        context,
        feedback: "DISLIKE",
      });
      setFeedback("DISLIKE");
      setIsDislikeModalOpen(false);
      router.push("/products");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setFeedbackErrorMessage(getFeedbackErrorMessage(error));
    } finally {
      setIsSubmittingFeedback(false);
    }
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
              aria-busy={isSubmittingFeedback && feedback === "LIKE"}
              disabled={isSubmittingFeedback || feedback === "DISLIKE"}
              onClick={() => void handleLike()}
              className="rounded-sm border-0 bg-foreground px-3 py-2 text-body !font-bold text-background disabled:cursor-not-allowed disabled:opacity-60"
            >
              마음에 들어요
            </button>
            <button
              type="button"
              aria-pressed={feedback === "DISLIKE"}
              disabled={isSubmittingFeedback || feedback === "DISLIKE"}
              onClick={() => {
                setFeedbackErrorMessage("");
                setIsDislikeModalOpen(true);
              }}
              className="rounded-sm border-0 bg-disabled px-3 py-2 text-body !font-bold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              별로예요
            </button>
          </div>
          {feedbackErrorMessage && !isDislikeModalOpen && (
            <p role="alert" className="mt-2 text-body-sm text-danger">
              {feedbackErrorMessage}
            </p>
          )}
        </section>
      )}

      <ActionButton onClick={handlePurchase} className="mt-1 !font-bold">
        구매하러 가기
      </ActionButton>

      <Modal
        open={isDislikeModalOpen}
        onClose={closeDislikeModal}
        title="해당 상품의 추천을 줄일게요."
        description="이 상품이 추천 목록에서 제거됩니다."
        actionsClassName="mt-8"
        firstAction={{
          label: "아니요",
          onClick: closeDislikeModal,
          disabled: isSubmittingFeedback,
        }}
        secondAction={{
          label: "예",
          onClick: () => void handleDislikeConfirm(),
          disabled: isSubmittingFeedback,
        }}
      >
        {feedbackErrorMessage && (
          <p role="alert" className="text-body-sm text-danger">
            {feedbackErrorMessage}
          </p>
        )}
      </Modal>
    </article>
  );
}
