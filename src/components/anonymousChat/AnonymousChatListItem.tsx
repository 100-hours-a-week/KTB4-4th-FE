// 대화 상대·상품·마지막 메시지와 안 읽은 메시지 수를 표시하는 대화 목록 행

import Link from "next/link";

import type { AnonymousChatListItem as AnonymousChatListItemData } from "@/lib/api/anonymousChats";
import { formatChatTime } from "@/lib/formatChatTime";

type AnonymousChatListItemProps = {
  chat: AnonymousChatListItemData;
};

const MAX_UNREAD_COUNT_LABEL = 99;

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function AnonymousChatListItem({ chat }: AnonymousChatListItemProps) {
  const { chatId, counterpartName, product, lastMessage, unreadCount } = chat;
  const hasUnread = unreadCount > 0;
  const unreadCountLabel =
    unreadCount > MAX_UNREAD_COUNT_LABEL ? `${MAX_UNREAD_COUNT_LABEL}+` : String(unreadCount);

  return (
    <li>
      {/* TODO: 채팅방 페이지 구현 후 이동 경로 확인 */}
      <Link
        href={`/chat/${chatId}`}
        className="-mx-page flex gap-3 px-page py-4 transition-colors hover:bg-background-subtle"
      >
        {/* TODO: 프로필 이미지 정책 확정 후 이미지 표시 */}
        <div aria-hidden="true" className="h-12 w-12 shrink-0 rounded-[35%] bg-background-subtle" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] leading-6 font-bold text-foreground">
            {counterpartName}
          </p>
          <p className="mt-0.5 truncate text-body-sm text-foreground-secondary">
            {product.name} · {formatPrice(product.price)}
          </p>
          {/* 긴 메시지는 두 줄까지만 표시하고 말줄임 처리함 */}
          <p className="mt-1 line-clamp-2 break-words text-body text-foreground">
            {lastMessage.content}
          </p>
        </div>

        {/* 전송 시각 아래에 안 읽은 메시지 수를 오른쪽 정렬로 표시함 */}
        <div className="flex shrink-0 flex-col items-end gap-3 pt-1.5">
          <time dateTime={lastMessage.sentAt} className="text-caption text-muted">
            {formatChatTime(lastMessage.sentAt)}
          </time>
          {hasUnread && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-birthday px-2 text-body-sm font-bold text-surface">
              <span className="sr-only">안 읽은 메시지 </span>
              {unreadCountLabel}
              <span className="sr-only">개</span>
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
