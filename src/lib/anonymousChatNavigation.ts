// 익명대화 목록 탭과 대화방 사이의 URL 생성 유틸리티

import type { AnonymousChatType } from "@/lib/api/anonymousChats";

export const ANONYMOUS_CHAT_TAB_QUERY_KEY = "tab";
export const ANONYMOUS_CHAT_RECEIVED_TAB_VALUE = "received";

export function getAnonymousChatTypeFromTab(tab: string | null | undefined): AnonymousChatType {
  return tab === ANONYMOUS_CHAT_RECEIVED_TAB_VALUE ? "RECEIVED" : "SENT";
}

export function getAnonymousChatListHref(type: AnonymousChatType) {
  return type === "RECEIVED"
    ? `/chat?${ANONYMOUS_CHAT_TAB_QUERY_KEY}=${ANONYMOUS_CHAT_RECEIVED_TAB_VALUE}`
    : "/chat";
}

export function getAnonymousChatRoomHref(roomId: number, type: AnonymousChatType) {
  const listHref = getAnonymousChatListHref(type);
  const queryStart = listHref.indexOf("?");

  return queryStart >= 0 ? `/chat/${roomId}${listHref.slice(queryStart)}` : `/chat/${roomId}`;
}
