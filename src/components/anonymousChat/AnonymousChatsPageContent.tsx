// 대화 목록 페이지의 탭 전환·탭별 대화 목록 조회·대화방 나가기 상태를 관리하는 클라이언트 화면
"use client";

import { useEffect, useState } from "react";

import AnonymousChatLeaveModal from "@/components/anonymousChat/AnonymousChatLeaveModal";
import AnonymousChatListItem from "@/components/anonymousChat/AnonymousChatListItem";
import EmptyAnonymousChats from "@/components/anonymousChat/EmptyAnonymousChats";
import PageIntro from "@/components/common/PageIntro";
import SegmentedTabs, { type SegmentedTabItem } from "@/components/common/SegmentedTabs";
import { useToastContext } from "@/contexts/ToastContext";
import {
  getAnonymousChats,
  type AnonymousChatsPage,
  type AnonymousChatType,
} from "@/lib/api/anonymousChats";

import styles from "./AnonymousChatList.module.css";

type AnonymousChatsPageContentProps = {
  initialType: AnonymousChatType;
};

const CHAT_TYPE_QUERY_KEY = "tab";
const RECEIVED_QUERY_VALUE = "received";

const CHAT_TABS: readonly SegmentedTabItem<AnonymousChatType>[] = [
  { value: "SENT", label: <span className="text-body-lg">내가 물어본</span> },
  { value: "RECEIVED", label: <span className="text-body-lg">나에게 물어본</span> },
];

const CHAT_PAGE_COPY: Record<AnonymousChatType, { title: string; description: string }> = {
  SENT: {
    title: "친구에게 물어본 선물이에요.",
    description: "친구의 답장을 확인해 보세요.",
  },
  RECEIVED: {
    title: "친구가 나에게 물어봤어요.",
    description: "익명으로 온 질문에 답해 보세요.",
  },
};

export default function AnonymousChatsPageContent({ initialType }: AnonymousChatsPageContentProps) {
  const [selectedType, setSelectedType] = useState<AnonymousChatType>(initialType);
  const [chatsByType, setChatsByType] = useState<
    Partial<Record<AnonymousChatType, AnonymousChatsPage>>
  >({});
  const [failedType, setFailedType] = useState<AnonymousChatType | null>(null);
  // 한 번에 한 대화만 나가기 버튼을 열어 두고, 나가기를 누른 대화는 확인 모달에서 처리함
  const [revealedChatId, setRevealedChatId] = useState<number | null>(null);
  const [leavingChatId, setLeavingChatId] = useState<number | null>(null);
  const { showToast } = useToastContext();
  const selectedChats = chatsByType[selectedType];
  const tabPanelLabel = selectedType === "RECEIVED" ? "나에게 물어본 대화" : "내가 물어본 대화";

  // 처음 여는 탭만 조회하고, 이미 불러온 탭은 저장된 목록을 다시 사용함
  useEffect(() => {
    if (chatsByType[selectedType]) return;

    let isActive = true;

    getAnonymousChats(selectedType)
      .then((page) => {
        if (!isActive) return;

        setChatsByType((current) => ({ ...current, [selectedType]: page }));
        setFailedType((current) => (current === selectedType ? null : current));
      })
      .catch(() => {
        if (isActive) {
          setFailedType(selectedType);
        }
      });

    return () => {
      isActive = false;
    };
  }, [chatsByType, selectedType]);

  // 탭 전환마다 기록이 쌓이지 않도록 현재 기록의 URL만 교체함
  const handleTypeChange = (type: AnonymousChatType) => {
    setSelectedType(type);
    setRevealedChatId(null);

    const nextSearchParams = new URLSearchParams(window.location.search);

    if (type === "RECEIVED") {
      nextSearchParams.set(CHAT_TYPE_QUERY_KEY, RECEIVED_QUERY_VALUE);
    } else {
      nextSearchParams.delete(CHAT_TYPE_QUERY_KEY);
    }

    const nextQuery = nextSearchParams.toString();
    window.history.replaceState(null, "", nextQuery ? `?${nextQuery}` : window.location.pathname);
  };

  // 나간 대화방은 목록에서 바로 지우고 결과를 토스트로 알림
  const handleLeft = (chatId: number) => {
    setChatsByType((current) => {
      const page = current[selectedType];

      return page
        ? {
            ...current,
            [selectedType]: { ...page, items: page.items.filter((chat) => chat.chatId !== chatId) },
          }
        : current;
    });
    setLeavingChatId(null);
    setRevealedChatId(null);
    showToast("채팅방을 나갔어요.");
  };

  const renderChatList = () => {
    if (failedType === selectedType) {
      return (
        <p role="alert" className="pt-8 text-center text-body-sm text-muted">
          대화 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      );
    }

    if (!selectedChats) {
      return (
        <p role="status" className="pt-8 text-center text-body-sm text-muted">
          대화 목록을 불러오는 중이에요.
        </p>
      );
    }

    if (selectedChats.items.length === 0) {
      return <EmptyAnonymousChats type={selectedType} />;
    }

    return (
      <ul className="m-0 list-none p-0">
        {selectedChats.items.map((chat) => (
          <AnonymousChatListItem
            key={chat.chatId}
            chat={chat}
            isLeaveRevealed={revealedChatId === chat.chatId}
            onRevealLeave={setRevealedChatId}
            onLeave={setLeavingChatId}
          />
        ))}
      </ul>
    );
  };

  return (
    // 제목과 탭은 고정하고 대화 목록 영역만 스크롤하므로 바깥 스크롤바 여백 제외
    <main
      aria-label="대화"
      data-scrollbar-gutter="none"
      className="page-content flex min-h-0 flex-1 flex-col bg-background"
    >
      <PageIntro
        title={CHAT_PAGE_COPY[selectedType].title}
        description={CHAT_PAGE_COPY[selectedType].description}
      />
      <SegmentedTabs
        items={CHAT_TABS}
        value={selectedType}
        onChange={handleTypeChange}
        ariaLabel="대화 목록 유형"
        variant="underline"
        className="mt-6"
      />
      {/* 스크롤바가 화면 오른쪽 끝에 붙도록 페이지 여백만큼 확장하고, 목록 끝이 하단 내비게이션의 돌출된 AI 버튼에 가려지지 않도록 하단 여백 확보 */}
      <div
        role="tabpanel"
        aria-label={tabPanelLabel}
        className={`-mx-page min-h-0 flex-1 overflow-y-auto overscroll-contain px-page pb-[calc(var(--spacing-bottom-nav-overlap)+var(--spacing-page))] ${styles.chatList}`}
      >
        {renderChatList()}
      </div>

      <AnonymousChatLeaveModal
        chatId={leavingChatId}
        onClose={() => setLeavingChatId(null)}
        onLeft={handleLeft}
      />
    </main>
  );
}
