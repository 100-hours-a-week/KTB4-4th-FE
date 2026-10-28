// 채팅방 정보를 조회해 헤더·안내 카드·상품 카드·메시지 목록·입력창을 조립하는 클라이언트 화면
"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AnonymousChatComposer from "@/components/anonymousChat/AnonymousChatComposer";
import AnonymousChatGuideCard from "@/components/anonymousChat/AnonymousChatGuideCard";
import AnonymousChatLeaveModal from "@/components/anonymousChat/AnonymousChatLeaveModal";
import AnonymousChatMessageList from "@/components/anonymousChat/AnonymousChatMessageList";
import AnonymousChatProductCard from "@/components/anonymousChat/AnonymousChatProductCard";
import AnonymousChatReportModal from "@/components/anonymousChat/AnonymousChatReportModal";
import AnonymousChatRoomHeader from "@/components/anonymousChat/AnonymousChatRoomHeader";
import AnonymousChatStartGuide from "@/components/anonymousChat/AnonymousChatStartGuide";
import { useToastContext } from "@/contexts/ToastContext";
import useVisualViewportHeight from "@/hooks/useVisualViewportHeight";
import {
  getAnonymousChatRoomInfo,
  getAnonymousChatRoomMessages,
  type AnonymousChatMessage,
  type AnonymousChatRoom,
} from "@/lib/api/anonymousChatRoom";
import { ApiRequestError } from "@/lib/api/client";

type AnonymousChatRoomContentProps = {
  chatId: number;
};

type RoomState =
  | { status: "loading" }
  | {
      status: "failed";
      message: string;
      retryAfterSeconds: number;
      canRetry: boolean;
    }
  | { status: "notFound" }
  | { status: "loaded"; room: AnonymousChatRoom };

const ONBOARDING_REQUIRED_MESSAGE = "온보딩 진행이 필요합니다.";

export default function AnonymousChatRoomContent({ chatId }: AnonymousChatRoomContentProps) {
  const [roomState, setRoomState] = useState<RoomState>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);
  const [openModal, setOpenModal] = useState<"report" | "leave" | null>(null);
  const router = useRouter();
  const { showToast } = useToastContext();

  useVisualViewportHeight();

  useEffect(() => {
    const requestController = new AbortController();
    let isActive = true;

    Promise.all([
      getAnonymousChatRoomInfo({ roomId: chatId, signal: requestController.signal }),
      getAnonymousChatRoomMessages(chatId),
    ])
      .then(([roomInfo, messageHistory]) => {
        if (isActive) {
          setRoomState({
            status: "loaded",
            room: { ...roomInfo, ...messageHistory },
          });
        }
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof Error && error.name === "AbortError")) {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        if (
          error instanceof ApiRequestError &&
          error.status === 403 &&
          error.message === ONBOARDING_REQUIRED_MESSAGE
        ) {
          router.replace("/onboarding");
          return;
        }

        if (error instanceof ApiRequestError && error.status === 404) {
          setRoomState({ status: "notFound" });
          return;
        }

        setRoomState({
          status: "failed",
          message:
            error instanceof ApiRequestError
              ? error.message
              : "대화방 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          retryAfterSeconds:
            error instanceof ApiRequestError && error.status === 429
              ? (error.retryAfterSeconds ?? 0)
              : 0,
          canRetry:
            !(error instanceof ApiRequestError) ||
            error.status === 429 ||
            error.status === 500 ||
            error.status === 503,
        });
      });

    return () => {
      isActive = false;
      requestController.abort();
    };
  }, [chatId, requestVersion, router]);

  const failedRetryAfterSeconds = roomState.status === "failed" ? roomState.retryAfterSeconds : 0;

  useEffect(() => {
    if (failedRetryAfterSeconds <= 0) {
      return;
    }

    const retryTimer = window.setInterval(() => {
      setRoomState((current) =>
        current.status === "failed"
          ? {
              ...current,
              retryAfterSeconds: Math.max(0, current.retryAfterSeconds - 1),
            }
          : current,
      );
    }, 1_000);

    return () => window.clearInterval(retryTimer);
  }, [failedRetryAfterSeconds]);

  if (roomState.status === "notFound") {
    notFound();
  }

  const appendMessage = (message: AnonymousChatMessage) => {
    setRoomState((current) =>
      current.status === "loaded"
        ? { ...current, room: { ...current.room, messages: [...current.room.messages, message] } }
        : current,
    );
  };

  const closeModal = () => setOpenModal(null);

  const handleReported = (message = "신고가 접수됐어요.") => {
    setOpenModal(null);
    showToast(message);
  };

  // 나간 채팅방은 더 이상 볼 수 없으므로 대화 목록으로 돌아감
  const handleLeft = () => {
    setOpenModal(null);
    showToast("채팅방을 나갔어요.");
    router.replace("/chat");
  };

  if (roomState.status !== "loaded") {
    return (
      <main aria-label="대화" className="page-content flex flex-1 flex-col bg-background">
        <p
          role={roomState.status === "failed" ? "alert" : "status"}
          className={`pt-8 text-center text-body-sm ${roomState.status === "failed" ? "text-danger" : "text-muted"}`}
        >
          {roomState.status === "failed" ? roomState.message : "대화를 불러오는 중이에요."}
        </p>
        {roomState.status === "failed" && roomState.canRetry && (
          <button
            type="button"
            disabled={roomState.retryAfterSeconds > 0}
            className="mx-auto mt-2 rounded-sm border border-border-strong bg-surface px-4 py-2 text-body-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              setRoomState({ status: "loading" });
              setRequestVersion((current) => current + 1);
            }}
          >
            {roomState.retryAfterSeconds > 0
              ? `${roomState.retryAfterSeconds}초 후 다시 시도`
              : "다시 시도"}
          </button>
        )}
      </main>
    );
  }

  const { room } = roomState;

  return (
    <main
      aria-label="대화"
      data-scrollbar-gutter="none"
      className="page-content flex min-h-0 flex-1 flex-col bg-background-subtle"
    >
      <div className="-mx-page">
        <AnonymousChatRoomHeader
          counterpartName={room.counterpartName}
          type={room.type}
          onReport={() => setOpenModal("report")}
          onLeave={() => setOpenModal("leave")}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-3 pt-4 pb-2">
        <AnonymousChatGuideCard counterpartName={room.counterpartName} type={room.type} />
        <AnonymousChatProductCard product={room.product} />
      </div>

      {room.messages.length > 0 ? (
        <AnonymousChatMessageList
          counterpartName={room.counterpartName}
          connectedAt={room.connectedAt}
          messages={room.messages}
        />
      ) : (
        <AnonymousChatStartGuide />
      )}

      <AnonymousChatComposer chatId={room.roomId} onMessageSent={appendMessage} />

      <AnonymousChatReportModal
        open={openModal === "report"}
        chatId={room.roomId}
        onClose={closeModal}
        onReported={handleReported}
      />
      <AnonymousChatLeaveModal
        chatId={openModal === "leave" ? room.roomId : null}
        onClose={closeModal}
        onLeft={handleLeft}
      />
    </main>
  );
}
