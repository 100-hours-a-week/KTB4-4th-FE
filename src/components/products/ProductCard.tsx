// 추천 상품의 기본 정보를 표시하는 카드 컴포넌트

import Link from "next/link";

type ProductCardProps = {
  product: {
    name: string;
    price: number;
    productImageUrl: string | null;
    purchaseUrl: string;
  };
  detailHref?: string;
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function ProductCard({ product, detailHref }: ProductCardProps) {
  const content = (
    <>
      <div
        role="img"
        aria-label={`${product.name} 상품 이미지`}
        className="aspect-square w-full rounded-md bg-disabled bg-cover bg-center bg-no-repeat"
        style={
          product.productImageUrl
            ? { backgroundImage: `url(${JSON.stringify(product.productImageUrl)})` }
            : undefined
        }
      />

      <div className="mt-2 min-w-0">
        <h2 className="line-clamp-2 text-body-sm font-medium text-foreground-secondary">
          {product.name}
        </h2>
        <p className="mt-0.5 text-body font-bold text-foreground">{formatPrice(product.price)}</p>
      </div>
    </>
  );

  const className = "flex w-full min-w-0 flex-col";

  if (detailHref) {
    return (
      <Link href={detailHref} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
}
