// 익명대화 목록 전체 페이지를 조회해 로그인 시점의 방별 읽지 않은 개수를 초기화하는 유틸 함수
"use client";

import { getAnonymousChats, type AnonymousChatType } from "@/lib/api/anonymousChats";
import { useAnonymousChatStore } from "@/stores/anonymousChatStore";

const UNREAD_SYNC_PAGE_SIZE = 50;
const CHAT_TYPES: readonly AnonymousChatType[] = ["SENT", "RECEIVED"];

async function syncUnreadByType(type: AnonymousChatType, signal: AbortSignal) {
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let isFirstPage = true;

  while (true) {
    const page = await getAnonymousChats({
      type,
      cursor,
      size: UNREAD_SYNC_PAGE_SIZE,
      signal,
    });

    useAnonymousChatStore
      .getState()
      .mergeChatListPage(type, page, isFirstPage ? "replace" : "append");

    if (!page.hasNext || !page.nextCursor || seenCursors.has(page.nextCursor)) return;

    seenCursors.add(page.nextCursor);
    cursor = page.nextCursor;
    isFirstPage = false;
  }
}

export async function syncAnonymousChatUnreadState(signal: AbortSignal) {
  await Promise.all(CHAT_TYPES.map((type) => syncUnreadByType(type, signal)));
}
