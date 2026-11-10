// 알림 카드에 보여줄 제목·본문과 구매 여부·익명대화방 알림의 상품 썸네일을 결정하는 유틸 함수
import type { ProductDetailContext } from "@/lib/api/productDetail";
import type {
  AnonymousRoomNotificationPreview,
  NotificationItem,
  PurchaseCheckNotificationPreview,
} from "@/types/notification";

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

// 첫 줄에 강조할 부분(상품명)을, 둘째 줄에 나머지 문구를 표시함
export interface NotificationTitleLead {
  highlight: string;
  rest: string;
}

export interface NotificationDisplay {
  // 강조 여부와 관계없이 전체 제목 문자열로, 접근성 라벨 등에 사용함
  title: string;
  titleParts: NotificationTitleParts | null;
  titleLead: NotificationTitleLead | null;
  description: string;
  thumbnail: NotificationThumbnail | null;
}

const PURCHASE_CHECK_TITLE_PREFIXES: Record<ProductDetailContext, string> = {
  PERSONAL: "지난 번에 추천받은 상품으로 본",
  MY_GIFT: "지난 번에 내 선물 추천으로 본",
  FRIEND_GIFT: "지난 번에 친구 추천 상품으로 본",
};

const PURCHASE_CHECK_TITLE_SUFFIX = ", 어떠셨나요?";

const ANONYMOUS_ROOM_TITLE_REST = "익명의 친구가 이 상품을 슬쩍 물어봤어요!";
const ANONYMOUS_ROOM_DESCRIPTION = "알림 클릭 시 친구가 보낸 채팅을 읽을 수 있어요.";

function getPurchaseCheckDisplay(
  body: string,
  title: string,
  preview: PurchaseCheckNotificationPreview,
): NotificationDisplay {
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
    titleLead: null,
    description: body,
    thumbnail: {
      imageUrl: preview.productImageUrl,
      productName: preview.productName,
    },
  };
}

function getAnonymousRoomDisplay(preview: AnonymousRoomNotificationPreview): NotificationDisplay {
  return {
    title: `${preview.productName} ${ANONYMOUS_ROOM_TITLE_REST}`,
    titleParts: null,
    titleLead: { highlight: preview.productName, rest: ANONYMOUS_ROOM_TITLE_REST },
    description: ANONYMOUS_ROOM_DESCRIPTION,
    thumbnail: {
      imageUrl: preview.productImageUrl,
      productName: preview.productName,
    },
  };
}

// preview 구조는 resourceType마다 다르므로 PURCHASE_CHECK·ANONYMOUS_ROOM일 때만 상품 미리보기로 사용하고,
// 미리보기가 없으면 서버 제목과 본문을 그대로 보여줌
export function getNotificationDisplay({
  title,
  body,
  resourceType,
  preview,
}: NotificationDisplaySource): NotificationDisplay {
  if (preview && resourceType === "PURCHASE_CHECK") {
    return getPurchaseCheckDisplay(body, title, preview as PurchaseCheckNotificationPreview);
  }

  if (preview && resourceType === "ANONYMOUS_ROOM") {
    return getAnonymousRoomDisplay(preview);
  }

  return { title, titleParts: null, titleLead: null, description: body, thumbnail: null };
}
