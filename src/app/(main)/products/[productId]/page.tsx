// 상품 문맥에 맞는 상세 정보를 서버에서 조회해 표시하는 페이지

import { notFound, redirect } from "next/navigation";

import PersonalProductDetailContent from "@/components/products/PersonalProductDetailContent";
import { getProductDetail, type ProductDetailContext } from "@/lib/api/productDetail";
import { handleServerPageError } from "@/lib/serverPageError";

type ProductDetailPageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{
    context?: string;
    userId?: string;
  }>;
};

const PRODUCT_DETAIL_CONTEXTS = new Set<ProductDetailContext>([
  "PERSONAL",
  "MY_GIFT",
  "FRIEND_GIFT",
]);

function isProductDetailContext(value: string | undefined): value is ProductDetailContext {
  return value !== undefined && PRODUCT_DETAIL_CONTEXTS.has(value as ProductDetailContext);
}

async function getProductDetailOrRedirect(
  productId: number,
  context: ProductDetailContext,
  userId?: number,
) {
  try {
    if (context === "FRIEND_GIFT") {
      return await getProductDetail({ productId, context, userId: userId as number });
    }

    return await getProductDetail({ productId, context });
  } catch (error) {
    handleServerPageError(error, { notFoundStatuses: [404] });
  }
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const [{ productId }, { context, userId }] = await Promise.all([params, searchParams]);
  const parsedProductId = Number(productId);

  if (!Number.isSafeInteger(parsedProductId) || parsedProductId <= 0) {
    notFound();
  }

  if (!isProductDetailContext(context)) {
    redirect("/error");
  }

  const parsedUserId = userId === undefined ? undefined : Number(userId);

  if (
    context === "FRIEND_GIFT" &&
    (!Number.isSafeInteger(parsedUserId) || (parsedUserId as number) <= 0)
  ) {
    notFound();
  }

  if (context !== "FRIEND_GIFT" && userId !== undefined) {
    redirect("/error");
  }

  const product = await getProductDetailOrRedirect(parsedProductId, context, parsedUserId);
  const detailProps =
    context === "FRIEND_GIFT"
      ? { product, context, friendUserId: parsedUserId as number }
      : { product, context };

  return (
    // 구매하러 가기 버튼이 하단 내비게이션의 돌출된 AI 버튼에 가려지지 않도록 하단 여백 확보
    <main
      aria-label="상품 상세"
      className="page-content flex flex-1 flex-col bg-background pb-[max(calc(var(--spacing-bottom-nav-overlap)+var(--spacing-page)),env(safe-area-inset-bottom))]"
    >
      <PersonalProductDetailContent {...detailProps} />
    </main>
  );
}
