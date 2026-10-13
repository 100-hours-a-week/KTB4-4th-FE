// 상품 문맥에 맞는 상세 정보를 서버에서 조회해 표시하는 페이지

import { redirect } from "next/navigation";

import PersonalProductDetailContent from "@/components/products/PersonalProductDetailContent";
import { getProductDetail, type ProductDetailContext } from "@/lib/api/productDetail";
import { ServerApiError } from "@/lib/api/serverClient";

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
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    redirect("/error");
  }
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const [{ productId }, { context, userId }] = await Promise.all([params, searchParams]);
  const parsedProductId = Number(productId);

  if (
    !Number.isSafeInteger(parsedProductId) ||
    parsedProductId <= 0 ||
    !isProductDetailContext(context)
  ) {
    redirect("/error");
  }

  const parsedUserId = userId === undefined ? undefined : Number(userId);

  if (
    (context === "FRIEND_GIFT" &&
      (!Number.isSafeInteger(parsedUserId) || (parsedUserId as number) <= 0)) ||
    (context !== "FRIEND_GIFT" && userId !== undefined)
  ) {
    redirect("/error");
  }

  const product = await getProductDetailOrRedirect(parsedProductId, context, parsedUserId);

  return (
    <main
      aria-label="상품 상세"
      className="page-content flex flex-1 flex-col bg-background pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <PersonalProductDetailContent product={product} context={context} />
    </main>
  );
}
