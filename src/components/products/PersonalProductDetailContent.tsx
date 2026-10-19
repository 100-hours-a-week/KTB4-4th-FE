// 상품과 추천 문맥에 맞는 상세 정보를 표시하는 컴포넌트
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ActionButton from "@/components/common/ActionButton";
import Modal from "@/components/common/Modal";
import { ApiRequestError } from "@/lib/api/client";
import { checkLoginValidity } from "@/lib/api/loginValidity";
import type { ProductDetail, ProductDetailContext } from "@/lib/api/productDetail";
import { saveProductFeedback } from "@/lib/api/productFeedback";
import { recordProductLinkClick } from "@/lib/api/productLinkClicks";
import { getProductCategoryName } from "@/lib/productCategories";

type PersonalProductDetailContentProps = {
  product: ProductDetail;
} & (
  | {
      context: Exclude<ProductDetailContext, "FRIEND_GIFT">;
      friendUserId?: never;
    }
  | {
      context: "FRIEND_GIFT";
      friendUserId: number;
    }
);

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
  friendUserId,
}: PersonalProductDetailContentProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(product.myFeedback);
  const [isDislikeModalOpen, setIsDislikeModalOpen] = useState(false);
  const [isLikeModalOpen, setIsLikeModalOpen] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackErrorMessage, setFeedbackErrorMessage] = useState("");
  const [loginNickname, setLoginNickname] = useState<string | null>(null);
  const isFriendGift = context === "FRIEND_GIFT";

  // 내 상품 상세에서만 추천 이유 제목에 표시할 로그인 사용자 닉네임을 조회하고, 실패 시 "나"로 표시함
  useEffect(() => {
    if (isFriendGift) {
      return;
    }

    let isActive = true;

    checkLoginValidity()
      .then(({ user }) => {
        if (isActive) {
          setLoginNickname(user.nickname);
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [isFriendGift]);

  const handlePurchase = () => {
    const clickRecord =
      context === "FRIEND_GIFT"
        ? {
            productId: product.productId,
            context,
            friendUserId,
            recommendationId: product.recommendation.recommendationId,
          }
        : {
            productId: product.productId,
            context,
            recommendationId: product.recommendation.recommendationId,
          };

    void recordProductLinkClick(clickRecord).catch(() => undefined);
    window.open(product.purchaseUrl, "_blank", "noopener,noreferrer");
  };

  const handleLike = async () => {
    // 이미 마음에 들어요를 저장했거나 별로예요를 선택한 상품은 중복 요청하지 않음
    if (isFriendGift || isSubmittingFeedback || feedback !== null) {
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
      setIsLikeModalOpen(true);
      // 뒤로가기로 재진입해도 저장된 만족도가 반영되도록 라우터 캐시의 상세 데이터를 갱신함
      router.refresh();
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

      <section aria-labelledby="product-name" className="border-b border-border pt-1 pb-4">
        <p className="text-body-sm font-bold text-foreground">
          {getProductCategoryName(product.category)}
        </p>
        <h1 id="product-name" className="mt-2 text-heading-3 font-normal text-muted">
          {product.name}
        </h1>
        {product.description && (
          <p className="mt-2 text-body text-foreground-secondary">{product.description}</p>
        )}
        <p className="mt-2 text-heading-2 font-bold text-foreground">
          {formatPrice(product.price)}
        </p>
      </section>

      <section
        aria-labelledby="recommendation-reason-title"
        // 내 상품 상세는 바로 아래 피드백 영역과 이어지도록 구분선을 표시하지 않음
        className={`pt-1 pb-4 ${isFriendGift ? "border-b border-border" : ""}`}
      >
        <h2
          id="recommendation-reason-title"
          className="flex min-w-0 text-heading-3 font-bold whitespace-nowrap text-foreground"
        >
          {isFriendGift ? (
            "친구에게 잘 맞는 이유"
          ) : (
            <>
              <span className="min-w-0 truncate text-info">{loginNickname ?? "나"}</span>
              <span className="shrink-0">{loginNickname ? "님에게" : "에게"} 잘 맞는 이유</span>
            </>
          )}
        </h2>
        <p className="mt-1 text-body text-foreground-secondary">{product.recommendation.reason}</p>
        <ul aria-label="추천 키워드" className="mt-4 flex list-none flex-wrap gap-2 p-0">
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
          className="rounded-md border border-border-strong px-4 py-4"
        >
          <h2 id="recommendation-feedback-title" className="text-body-lg font-bold text-foreground">
            니쥬가 추천한 이 상품, 어때요?
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={feedback === "LIKE"}
              aria-busy={isSubmittingFeedback && feedback === "LIKE"}
              disabled={isSubmittingFeedback || feedback !== null}
              onClick={() => void handleLike()}
              className="rounded-sm border-0 bg-primary px-3 py-2 text-body-sm text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
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
              className="rounded-sm border-0 bg-foreground px-3 py-2 text-body-sm text-background disabled:cursor-not-allowed disabled:opacity-60"
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
        open={isLikeModalOpen}
        onClose={() => setIsLikeModalOpen(false)}
        title="피드백 감사합니다!"
        actionsClassName="mt-8"
        secondAction={{
          label: "닫기",
          onClick: () => setIsLikeModalOpen(false),
        }}
      />

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
