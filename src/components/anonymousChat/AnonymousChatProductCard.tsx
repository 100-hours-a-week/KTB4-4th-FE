// 채팅방에서 이야기하는 선물 후보 상품의 이미지·카테고리·이름·가격과 보러가기 버튼을 표시하는 카드

import Link from "next/link";

import type { AnonymousChatRoomProduct } from "@/lib/api/anonymousChatRoom";
import { getProductCategoryName } from "@/lib/productCategories";

type AnonymousChatProductCardProps = {
  product: AnonymousChatRoomProduct;
  detailHref: string;
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function AnonymousChatProductCard({
  product,
  detailHref,
}: AnonymousChatProductCardProps) {
  return (
    <section
      aria-label="선물 후보 상품"
      className="flex items-center gap-4 rounded-md border border-border-strong bg-surface px-4 py-3"
    >
      <div
        aria-hidden="true"
        className="h-16 w-16 shrink-0 rounded-sm bg-background-subtle bg-cover bg-center bg-no-repeat"
        style={
          product.imageUrl
            ? { backgroundImage: `url(${JSON.stringify(product.imageUrl)})` }
            : undefined
        }
      />
      <div className="min-w-0 flex-1">
        {product.category && (
          <p className="truncate text-body-sm font-bold text-foreground">
            {getProductCategoryName(product.category)}
          </p>
        )}
        <p className="truncate text-body text-muted">{product.name}</p>
        <p className="mt-1 text-body-lg font-bold text-foreground">{formatPrice(product.price)}</p>
      </div>
      <Link
        href={detailHref}
        aria-label={`${product.name} 보러가기`}
        className="group touch-target flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus-visible:outline-none"
      >
        <span className="rounded-full bg-primary px-3 py-1.5 text-body-sm leading-none font-bold text-on-primary transition-colors group-hover:bg-primary-hover group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-foreground">
          보러가기
        </span>
      </Link>
    </section>
  );
}
