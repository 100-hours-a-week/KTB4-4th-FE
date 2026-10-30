// 익명 채팅방 정보·메시지 조회와 메시지 전송 요청 및 응답 타입
"use client";

import type { AnonymousChatType } from "@/lib/api/anonymousChats";
import { ApiRequestError, apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { sendMockAnonymousChatMessage } from "@/mocks/anonymousChatRoom";
import type { AnonymousChatProfile } from "@/types/anonymousChatProfile";

export interface AnonymousChatRoomProduct {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
}

export interface AnonymousChatMessage {
  messageId: number;
  clientMessageId?: string;
  content: string;
  isMine: boolean;
  unreadCount: number;
  sentAt: string;
}

export type AnonymousChatRoomStatus = "ACTIVE" | "ENDED";
export type AnonymousChatRoomEndedReason = "ME_LEFT" | "PARTNER_LEFT";

interface AnonymousChatRoomInfoBase {
  roomId: number;
  counterpartName: string;
  counterpartProfile: AnonymousChatProfile;
  product: AnonymousChatRoomProduct;
}

export type AnonymousChatRoomInfo = AnonymousChatRoomInfoBase &
  (
    | {
        type: Extract<AnonymousChatType, "SENT">;
        targetUserId: number;
      }
    | {
        type: Extract<AnonymousChatType, "RECEIVED">;
        targetUserId: null;
      }
  );

export interface AnonymousChatRoomMessages {
  roomStatus: AnonymousChatRoomStatus;
  endedReason: AnonymousChatRoomEndedReason | null;
  endedAt: string | null;
  messages: AnonymousChatMessage[];
  nextCursor: string | null;
  hasNext: boolean;
}

export type AnonymousChatRoom = AnonymousChatRoomInfo & AnonymousChatRoomMessages;

interface AnonymousChatRoomInfoResponseBase {
  roomId: number;
  targetName: string;
  targetProfile: AnonymousChatProfile;
  product: AnonymousChatRoomProduct;
}

interface AnonymousChatRoomInfoResponse {
  message: string;
  data: AnonymousChatRoomInfoResponseBase &
    ({ askedByMe: true; targetUserId: number } | { askedByMe: false; targetUserId: null });
}

interface AnonymousChatRoomErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

interface AnonymousChatMessageResponseItem {
  messageId: number;
  sender: "ME" | "OTHER";
  content: string;
  unreadCount: number;
  sentAt: string;
}

interface AnonymousChatRoomMessagesResponse {
  message: string;
  data: {
    targetName: string;
    roomStatus: AnonymousChatRoomStatus;
    endedReason: AnonymousChatRoomEndedReason | null;
    endedAt: string | null;
    items: AnonymousChatMessageResponseItem[];
  };
  nextCursor: string | null;
  hasNext: boolean;
}

interface GetAnonymousChatRoomInfoParams {
  roomId: number;
  signal?: AbortSignal;
}

interface GetAnonymousChatRoomMessagesParams {
  roomId: number;
  cursor?: string;
  size?: number;
  signal?: AbortSignal;
}

interface MarkAnonymousChatMessagesReadParams {
  roomId: number;
  lastReadMessageId: number;
  signal?: AbortSignal;
}

const ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  404: "사용자 정보를 찾을 수 없습니다.",
  422: "입력 값이 유효하지 않습니다. 입력한 내용을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

const DEFAULT_MESSAGE_PAGE_SIZE = 20;
const MIN_MESSAGE_PAGE_SIZE = 1;
const MAX_MESSAGE_PAGE_SIZE = 50;

function getRetryAfterSeconds(
  response: Response,
  errorResponse: AnonymousChatRoomErrorResponse | null,
) {
  const responseBodySeconds = errorResponse?.data?.retryAfterSeconds;

  if (typeof responseBodySeconds === "number" && Number.isFinite(responseBodySeconds)) {
    return Math.max(0, Math.ceil(responseBodySeconds));
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;

  return Number.isFinite(retryAfterSeconds) ? Math.max(0, Math.ceil(retryAfterSeconds)) : undefined;
}

export async function getAnonymousChatRoomInfo({
  roomId,
  signal,
}: GetAnonymousChatRoomInfoParams): Promise<AnonymousChatRoomInfo> {
  if (!Number.isSafeInteger(roomId) || roomId <= 0) {
    throw new ApiRequestError(ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES[400] as string, 400);
  }

  const response = await apiFetch(API_ENDPOINTS.anonymousChats.room(roomId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AnonymousChatRoomErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES[response.status] ??
        "익명대화방 정보를 불러오지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data } = (await response.json()) as AnonymousChatRoomInfoResponse;

  if (data.askedByMe) {
    if (!Number.isSafeInteger(data.targetUserId) || data.targetUserId <= 0) {
      throw new ApiRequestError("대화방 상품 정보를 불러오지 못했습니다.", 500);
    }

    return {
      roomId: data.roomId,
      type: "SENT",
      targetUserId: data.targetUserId,
      counterpartName: data.targetName,
      counterpartProfile: data.targetProfile,
      product: data.product,
    };
  }

  if (data.targetUserId !== null) {
    throw new ApiRequestError("대화방 상품 정보를 불러오지 못했습니다.", 500);
  }

  return {
    roomId: data.roomId,
    type: "RECEIVED",
    targetUserId: null,
    counterpartName: data.targetName,
    counterpartProfile: data.targetProfile,
    product: data.product,
  };
}

export async function getAnonymousChatRoomMessages({
  roomId,
  cursor,
  size = DEFAULT_MESSAGE_PAGE_SIZE,
  signal,
}: GetAnonymousChatRoomMessagesParams): Promise<
  AnonymousChatRoomMessages & { targetName: string }
> {
  if (!Number.isSafeInteger(roomId) || roomId <= 0) {
    throw new ApiRequestError(ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES[400] as string, 400);
  }

  if (!Number.isInteger(size) || size < MIN_MESSAGE_PAGE_SIZE || size > MAX_MESSAGE_PAGE_SIZE) {
    throw new ApiRequestError(ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES[422] as string, 422);
  }

  const searchParams = new URLSearchParams({ size: String(size) });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await apiFetch(
    `${API_ENDPOINTS.anonymousChats.messages(roomId)}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as AnonymousChatRoomErrorResponse | null;

    throw new ApiRequestError(
      errorResponse?.message ??
        ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES[response.status] ??
        "익명대화 메시지를 불러오지 못했습니다.",
      response.status,
      getRetryAfterSeconds(response, errorResponse),
    );
  }

  const { data, nextCursor, hasNext } =
    (await response.json()) as AnonymousChatRoomMessagesResponse;

  return {
    targetName: data.targetName,
    roomStatus: data.roomStatus,
    endedReason: data.endedReason,
    endedAt: data.endedAt,
    // 서버는 최신순으로 반환하고 화면은 과거에서 최신 방향으로 표시함
    messages: data.items
      .map((message) => ({
        messageId: message.messageId,
        content: message.content,
        isMine: message.sender === "ME",
        unreadCount: message.unreadCount,
        sentAt: message.sentAt,
      }))
      .reverse(),
    nextCursor,
    hasNext,
  };
}

export async function markAnonymousChatMessagesRead({
  roomId,
  lastReadMessageId,
  signal,
}: MarkAnonymousChatMessagesReadParams): Promise<void> {
  if (!Number.isSafeInteger(roomId) || roomId <= 0) {
    throw new ApiRequestError(ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES[400] as string, 400);
  }

  if (!Number.isSafeInteger(lastReadMessageId) || lastReadMessageId <= 0) {
    throw new ApiRequestError(ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES[422] as string, 422);
  }

  const response = await apiFetch(API_ENDPOINTS.anonymousChats.read(roomId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lastReadMessageId }),
    cache: "no-store",
    signal,
  });

  if (response.status === 204) {
    return;
  }

  const errorResponse = (await response
    .json()
    .catch(() => null)) as AnonymousChatRoomErrorResponse | null;

  throw new ApiRequestError(
    errorResponse?.message ??
      ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES[response.status] ??
      "익명대화 메시지 읽음 상태를 저장하지 못했습니다.",
    response.status,
    getRetryAfterSeconds(response, errorResponse),
  );
}

// TODO: 익명 채팅 메시지 전송 API 연동 후 서버에 저장된 메시지 반환
export async function sendAnonymousChatMessage(
  roomId: number,
  content: string,
): Promise<AnonymousChatMessage> {
  return sendMockAnonymousChatMessage(roomId, content);
}
