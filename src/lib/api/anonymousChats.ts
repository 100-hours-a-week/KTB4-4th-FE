// 익명 채팅 대화 목록 조회·대화방 나가기 요청과 응답 타입
"use client";

import { ApiRequestError, apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { leaveMockAnonymousChat } from "@/mocks/anonymousChats";

// SENT는 내가 친구에게 물어본 대화, RECEIVED는 익명의 친구가 나에게 물어본 대화
export type AnonymousChatType = "SENT" | "RECEIVED";
export type AnonymousChatRole = "ASKER" | "RESPONDER";

export interface AnonymousChatListProduct {
  productId: number;
  name: string;
}

export interface AnonymousChatLastMessage {
  messageId: number;
  content: string;
  sender: string;
  sentAt: string;
}

export interface AnonymousChatListItem {
  roomId: number;
  counterpartAlias: string;
  hasUnreadMessage: boolean;
  unreadMessageCount: number;
  lastActiveAt: string;
  lastMessage: AnonymousChatLastMessage | null;
  product: AnonymousChatListProduct;
}

export interface AnonymousChatsPage {
  items: AnonymousChatListItem[];
  nextCursor: string | null;
  hasNext: boolean;
}

interface AnonymousChatsResponse {
  message: string;
  data: {
    items: AnonymousChatListItem[];
  };
  nextCursor: string | null;
  hasNext: boolean;
}

interface AnonymousChatsErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

interface GetAnonymousChatsParams {
  type: AnonymousChatType;
  cursor?: string;
  size: number;
  signal?: AbortSignal;
}

const CHAT_ROLE_BY_TYPE: Record<AnonymousChatType, AnonymousChatRole> = {
  SENT: "ASKER",
  RECEIVED: "RESPONDER",
};
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 50;
const ANONYMOUS_CHATS_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  422: "입력 값이 유효하지 않습니다. 입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
};

function getRetryAfterSeconds(
  response: Response,
  errorResponse: AnonymousChatsErrorResponse | null,
) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(retryAfterSeconds) ? Math.max(0, Math.ceil(retryAfterSeconds)) : undefined;
}

export async function getAnonymousChats({
  type,
  cursor,
  size,
  signal,
}: GetAnonymousChatsParams): Promise<AnonymousChatsPage> {
  if (!Number.isInteger(size) || size < MIN_PAGE_SIZE || size > MAX_PAGE_SIZE) {
    throw new ApiRequestError(
      `익명 대화 목록은 ${MIN_PAGE_SIZE}개 이상 ${MAX_PAGE_SIZE}개 이하로 요청해 주세요.`,
      422,
    );
  }

  const searchParams = new URLSearchParams({
    role: CHAT_ROLE_BY_TYPE[type],
    size: String(size),
  });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await apiFetch(
    `${API_ENDPOINTS.anonymousChats.list}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AnonymousChatsErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        ANONYMOUS_CHATS_ERROR_MESSAGES[response.status] ??
        "익명 대화 목록을 불러오지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data, nextCursor, hasNext } = (await response.json()) as AnonymousChatsResponse;

  return {
    items: data.items,
    nextCursor,
    hasNext,
  };
}

// TODO: 익명 채팅방 나가기 API 연동 후 서버 요청으로 교체 (나간 뒤 상대에게 보이는 방식 확인 필요)
export async function leaveAnonymousChat(chatId: number) {
  await leaveMockAnonymousChat(chatId);
}
