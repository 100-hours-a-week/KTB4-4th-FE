// 익명 채팅방 정보·메시지 조회와 메시지 전송 요청 및 응답 타입
"use client";

import type { AnonymousChatType } from "@/lib/api/anonymousChats";
import { ApiRequestError, apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  getMockAnonymousChatMessages,
  sendMockAnonymousChatMessage,
} from "@/mocks/anonymousChatRoom";

export interface AnonymousChatRoomProduct {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
}

export interface AnonymousChatMessage {
  messageId: number;
  content: string;
  isMine: boolean;
  sentAt: string;
}

export interface AnonymousChatRoomInfo {
  roomId: number;
  type: AnonymousChatType;
  counterpartName: string;
  product: AnonymousChatRoomProduct;
}

export interface AnonymousChatRoomMessages {
  connectedAt: string;
  messages: AnonymousChatMessage[];
}

export type AnonymousChatRoom = AnonymousChatRoomInfo & AnonymousChatRoomMessages;

interface AnonymousChatRoomInfoResponse {
  message: string;
  data: {
    roomId: number;
    askedByMe: boolean;
    targetName: string;
    product: AnonymousChatRoomProduct;
  };
}

interface AnonymousChatRoomErrorResponse {
  message?: string;
  data?: {
    retryAfterSeconds?: number;
  } | null;
}

interface GetAnonymousChatRoomInfoParams {
  roomId: number;
  signal?: AbortSignal;
}

const ANONYMOUS_CHAT_ROOM_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "이용이 제한된 계정입니다.",
  404: "사용자 정보를 찾을 수 없습니다.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "요청을 처리하지 못했습니다.",
  503: "일시적으로 서비스를 이용할 수 없습니다.",
};

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

  return {
    roomId: data.roomId,
    type: data.askedByMe ? "SENT" : "RECEIVED",
    counterpartName: data.targetName,
    product: data.product,
  };
}

// TODO: 익명 채팅 메시지 조회 API 연동 후 목업 대신 서버 응답 반환
export async function getAnonymousChatRoomMessages(
  roomId: number,
): Promise<AnonymousChatRoomMessages> {
  return getMockAnonymousChatMessages(roomId);
}

// TODO: 익명 채팅 메시지 전송 API 연동 후 서버에 저장된 메시지 반환
export async function sendAnonymousChatMessage(
  roomId: number,
  content: string,
): Promise<AnonymousChatMessage> {
  return sendMockAnonymousChatMessage(roomId, content);
}
