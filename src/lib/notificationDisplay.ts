// 알림 카드에 보여줄 제목·본문과 구매 여부 알림의 상품 썸네일을 결정하는 유틸 함수
import type { ProductDetailContext } from "@/lib/api/productDetail";
import type { NotificationItem } from "@/types/notification";

type NotificationDisplaySource = Pick<
  NotificationItem,
  "title" | "body" | "resourceType" | "preview"
>;

export interface NotificationThumbnail {
  imageUrl: string | null;
  productName: string;
}

// 제목 중 강조할 부분(상품명)과 앞뒤 문구로, 앞 문구는 첫 줄에 상품명과 뒤 문구는 둘째 줄에 표시함
export interface NotificationTitleParts {
  before: string;
  highlight: string;
  after: string;
}

export interface NotificationDisplay {
  // 강조 여부와 관계없이 전체 제목 문자열로, 접근성 라벨 등에 사용함
  title: string;
  titleParts: NotificationTitleParts | null;
  description: string;
  thumbnail: NotificationThumbnail | null;
}

const PURCHASE_CHECK_TITLE_PREFIXES: Record<ProductDetailContext, string> = {
  PERSONAL: "지난 번에 추천받은 상품으로 본",
  MY_GIFT: "지난 번에 내 선물 추천으로 본",
  FRIEND_GIFT: "지난 번에 친구 추천 상품으로 본",
};

const PURCHASE_CHECK_TITLE_SUFFIX = ", 어떠셨나요?";

// preview 구조는 resourceType마다 다르므로 PURCHASE_CHECK일 때만 상품 미리보기로 사용하고,
// 미리보기가 없으면 서버 제목과 본문을 그대로 보여줌
export function getNotificationDisplay({
  title,
  body,
  resourceType,
  preview,
}: NotificationDisplaySource): NotificationDisplay {
  if (resourceType !== "PURCHASE_CHECK" || !preview) {
    return { title, titleParts: null, description: body, thumbnail: null };
  }

  // 정의되지 않은 context가 내려오면 문구를 만들 수 없으므로 서버 제목을 사용함
  const titlePrefix: string | undefined = PURCHASE_CHECK_TITLE_PREFIXES[preview.context];
  const titleParts = titlePrefix
    ? {
        before: titlePrefix,
        highlight: preview.productName,
        after: PURCHASE_CHECK_TITLE_SUFFIX,
      }
    : null;

  return {
    title: titleParts ? `${titleParts.before} ${titleParts.highlight}${titleParts.after}` : title,
    titleParts,
    description: body,
    thumbnail: {
      imageUrl: preview.productImageUrl,
      productName: preview.productName,
    },
  };
}
