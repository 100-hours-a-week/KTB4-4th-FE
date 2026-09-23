// 추천 상품의 공통 정보와 선택적인 추천 이유를 표시하는 카드 컴포넌트

type ProductCardProps = {
  product: {
    name: string;
    price: number;
    imageUrl: string | null;
    reason?: string;
  };
};

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="flex w-full cursor-pointer gap-4 rounded-lg border border-border-strong bg-surface p-4">
      <div
        role="img"
        aria-label={`${product.name} 상품 이미지`}
        className="h-20 w-20 shrink-0 rounded-md bg-disabled bg-cover bg-center bg-no-repeat"
        style={
          product.imageUrl
            ? { backgroundImage: `url(${JSON.stringify(product.imageUrl)})` }
            : undefined
        }
      />

      <div className="min-w-0 flex-1">
        <h2 className="text-heading-3 font-semibold text-foreground">{product.name}</h2>
        <p className="mt-1 text-body-lg font-bold text-foreground">{formatPrice(product.price)}</p>
        {product.reason && <p className="mt-1 text-body-sm text-muted">{product.reason}</p>}
      </div>
    </article>
  );
}
