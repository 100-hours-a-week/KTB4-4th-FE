// 구매 여부 알림을 눌렀을 때 상품·친구 정보와 답변 상태를 보여주는 구매 확인 모달

"use client";

import Modal from "@/components/common/Modal";
import type { PurchaseCheck } from "@/lib/api/purchaseChecks";

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
  const { product, answered, purchased } = purchaseCheck;
  const isSoldOut = product.status === "SOLD_OUT";
  // 판매 중단 상품은 구매 링크를 숨김
  const canShowPurchaseLink = product.status !== "UNAVAILABLE" && product.purchaseUrl !== null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={answered ? "이미 답했어요" : "이 상품, 구매하셨나요?"}
      description={getContextLabel(purchaseCheck)}
      actionsClassName="mt-8"
      // TODO: 구매 여부 답변 전송 이슈에서 구매했어요·안 했어요 버튼 추가
      secondAction={{
        label: <span className="font-bold">닫기</span>,
        onClick: onClose,
      }}
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

      {answered && purchased !== null && (
        <p className="mt-6 rounded-md bg-background-subtle px-3 py-2.5 text-body-sm text-foreground-secondary">
          내 답변:{" "}
          <span className="font-bold text-foreground">
            {purchased ? "구매했어요" : "안 했어요"}
          </span>
        </p>
      )}
    </Modal>
  );
}
