// 채팅방에서 이야기하는 선물 후보 상품의 이미지·카테고리·이름·가격과 보러가기 버튼을 표시하는 접이식 카드
"use client";

import Link from "next/link";
import { useEffect } from "react";

import type { AnonymousChatRoomProduct } from "@/lib/api/anonymousChatRoom";
import { getProductCategoryName } from "@/lib/productCategories";
import { useAnonymousChatProductCardStore } from "@/stores/anonymousChatProductCardStore";

type AnonymousChatProductCardProps = {
  product: AnonymousChatRoomProduct;
  detailHref: string;
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function AnonymousChatProductCard({
  product,
  detailHref,
}: AnonymousChatProductCardProps) {
  const isCollapsed = useAnonymousChatProductCardStore((state) => state.isCollapsed);
  const toggleCollapsed = useAnonymousChatProductCardStore((state) => state.toggleCollapsed);

  useEffect(() => {
    void useAnonymousChatProductCardStore.persist.rehydrate();
  }, []);

  return (
    <section
      aria-label="선물 후보 상품"
      className={`flex items-center rounded-md border border-border bg-surface shadow-md ${
        isCollapsed ? "gap-3 py-2 pr-1 pl-4" : "gap-4 py-3 pr-1 pl-4"
      }`}
    >
      <div
        aria-hidden="true"
        className={`shrink-0 rounded-sm bg-background-subtle bg-cover bg-center bg-no-repeat ${
          isCollapsed ? "h-10 w-10" : "h-16 w-16"
        }`}
        style={
          product.imageUrl
            ? { backgroundImage: `url(${JSON.stringify(product.imageUrl)})` }
            : undefined
        }
      />
      <div id="anonymous-chat-product-details" className="min-w-0 flex-1">
        {!isCollapsed && product.category && (
          <p className="truncate text-body-sm font-bold text-foreground">
            {getProductCategoryName(product.category)}
          </p>
        )}
        <p className="truncate text-body text-muted">{product.name}</p>
        {!isCollapsed && (
          <p className="mt-1 text-body-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </p>
        )}
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
      <button
        type="button"
        aria-controls="anonymous-chat-product-details"
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "선물 후보 상품 정보 펼치기" : "선물 후보 상품 정보 접기"}
        onClick={toggleCollapsed}
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-muted transition-colors hover:text-foreground focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-info"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-[var(--duration-base)] ${
            isCollapsed ? "" : "rotate-180"
          }`}
        >
          <path
            d="M5 9L12 16L19 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}
