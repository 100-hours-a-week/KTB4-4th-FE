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
  getAnonymousChatRoom,
  type AnonymousChatMessage,
  type AnonymousChatRoom,
} from "@/lib/api/anonymousChatRoom";

type AnonymousChatRoomContentProps = {
  chatId: number;
};

type RoomState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "notFound" }
  | { status: "loaded"; room: AnonymousChatRoom };

export default function AnonymousChatRoomContent({ chatId }: AnonymousChatRoomContentProps) {
  const [roomState, setRoomState] = useState<RoomState>({ status: "loading" });
  const [openModal, setOpenModal] = useState<"report" | "leave" | null>(null);
  const router = useRouter();
  const { showToast } = useToastContext();

  useVisualViewportHeight();

  useEffect(() => {
    let isActive = true;

    getAnonymousChatRoom(chatId)
      .then((room) => {
        if (isActive) {
          setRoomState(room ? { status: "loaded", room } : { status: "notFound" });
        }
      })
      .catch(() => {
        if (isActive) {
          setRoomState({ status: "failed" });
        }
      });

    return () => {
      isActive = false;
    };
  }, [chatId]);

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
          className="pt-8 text-center text-body-sm text-muted"
        >
          {roomState.status === "failed"
            ? "대화를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
            : "대화를 불러오는 중이에요."}
        </p>
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

      <AnonymousChatComposer chatId={room.chatId} onMessageSent={appendMessage} />

      <AnonymousChatReportModal
        open={openModal === "report"}
        chatId={room.chatId}
        onClose={closeModal}
        onReported={handleReported}
      />
      <AnonymousChatLeaveModal
        chatId={openModal === "leave" ? room.chatId : null}
        onClose={closeModal}
        onLeft={handleLeft}
      />
    </main>
  );
}
