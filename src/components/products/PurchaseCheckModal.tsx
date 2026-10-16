// 구매 여부 알림을 눌렀을 때 상품·친구 정보를 보여주고 구매 여부 답변을 전송하는 구매 확인 모달

"use client";

import { useState } from "react";

import Modal from "@/components/common/Modal";
import { ApiRequestError } from "@/lib/api/client";
import { answerPurchaseCheck, type PurchaseCheck } from "@/lib/api/purchaseChecks";

type PurchaseCheckModalProps = {
  open: boolean;
  purchaseCheck: PurchaseCheck;
  onClose: () => void;
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

// 구매 링크를 누른 위치를 안내하며, 친구 정보가 없으면 이름 없이 표시함
function getContextLabel({ context, friend }: PurchaseCheck) {
  switch (context) {
    case "FRIEND_GIFT":
      return friend ? `${friend.name} 님 선물로 본 상품` : "친구 선물로 본 상품";
    case "MY_GIFT":
      return "내 선물 추천에서 본 상품";
    case "PERSONAL":
    default:
      return "추천받은 상품";
  }
}

export default function PurchaseCheckModal({
  open,
  purchaseCheck,
  onClose,
}: PurchaseCheckModalProps) {
  const { purchaseCheckId, product } = purchaseCheck;
  // 답변 전송 성공이나 다른 탭에서 먼저 답한 경우(409)를 반영한 답변 완료 여부
  const [isAnswered, setIsAnswered] = useState(purchaseCheck.answered);
  const [isAnswering, setIsAnswering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSoldOut = product.status === "SOLD_OUT";
  // 판매 중단 상품은 구매 링크를 숨김
  const canShowPurchaseLink = product.status !== "UNAVAILABLE" && product.purchaseUrl !== null;

  // 구매했다고 답할 때만 답변을 저장하며, 이미 답한 구매 확인이면 답변 완료 상태로 바꿈
  const answerPurchased = async () => {
    if (isAnswering) return;

    setIsAnswering(true);
    setErrorMessage(null);

    try {
      await answerPurchaseCheck(purchaseCheckId, true);
      setIsAnswered(true);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setIsAnswered(true);
        return;
      }

      setErrorMessage(
        error instanceof ApiRequestError ? error.message : "구매 여부를 저장하지 못했습니다.",
      );
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isAnswered ? "이미 답변한 상품이에요." : "이 상품, 구매하셨나요?"}
      description={getContextLabel(purchaseCheck)}
      actionsClassName="mt-8"
      // 구매 안했어요는 답변을 저장하지 않고 모달만 닫음
      firstAction={
        isAnswered
          ? undefined
          : {
              label: <span className="font-bold">구매 안했어요</span>,
              onClick: onClose,
              disabled: isAnswering,
            }
      }
      secondAction={
        isAnswered
          ? { label: <span className="font-bold">닫기</span>, onClick: onClose }
          : {
              label: <span className="font-bold">구매 했어요</span>,
              onClick: () => void answerPurchased(),
              disabled: isAnswering,
            }
      }
    >
      <div className="flex gap-3">
        <div
          role="img"
          aria-label={`${product.name} 상품 이미지`}
          className="size-20 shrink-0 rounded-md bg-disabled bg-cover bg-center bg-no-repeat"
          style={
            product.productImageUrl
              ? { backgroundImage: `url(${JSON.stringify(product.productImageUrl)})` }
              : undefined
          }
        />

        <div className="min-w-0 flex-1">
          {isSoldOut && (
            <span className="mb-1 inline-block rounded-sm bg-background-subtle px-1.5 py-0.5 text-caption font-bold text-muted">
              품절
            </span>
          )}
          <p className="line-clamp-2 text-body-sm font-medium text-foreground-secondary">
            {product.name}
          </p>
          {product.price !== null && (
            <p className="mt-0.5 text-body font-bold text-foreground">
              {formatPrice(product.price)}
            </p>
          )}
          {canShowPurchaseLink && (
            <a
              href={product.purchaseUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-body-sm text-muted underline underline-offset-2"
            >
              구매 페이지 보기
            </a>
          )}
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-4 text-body-sm text-danger">
          {errorMessage}
        </p>
      )}
    </Modal>
  );
}
