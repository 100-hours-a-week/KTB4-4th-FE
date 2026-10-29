// 대화 목록 페이지의 탭 전환·탭별 대화 목록 조회·대화방 나가기 상태를 관리하는 클라이언트 화면
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AnonymousChatLeaveModal from "@/components/anonymousChat/AnonymousChatLeaveModal";
import AnonymousChatListItem from "@/components/anonymousChat/AnonymousChatListItem";
import EmptyAnonymousChats from "@/components/anonymousChat/EmptyAnonymousChats";
import PageIntro from "@/components/common/PageIntro";
import SegmentedTabs, { type SegmentedTabItem } from "@/components/common/SegmentedTabs";
import { useToastContext } from "@/contexts/ToastContext";
import {
  getAnonymousChats,
  type AnonymousChatListItem as AnonymousChatListItemData,
  type AnonymousChatsPage,
  type AnonymousChatType,
} from "@/lib/api/anonymousChats";
import { ApiRequestError } from "@/lib/api/client";
import {
  addAnonymousChatEventHandler,
  type AnonymousChatEvent,
} from "@/lib/websocket/anonymousChatEvents";
import { useAnonymousChatStore, type AnonymousChatRoomEntity } from "@/stores/anonymousChatStore";

import styles from "./AnonymousChatList.module.css";

type AnonymousChatsPageContentProps = {
  initialType: AnonymousChatType;
};

const CHAT_TYPE_QUERY_KEY = "tab";
const RECEIVED_QUERY_VALUE = "received";
const PAGE_SIZE = 20;
const ONBOARDING_REQUIRED_MESSAGE = "온보딩 진행이 필요합니다.";
const CHAT_TYPES: readonly AnonymousChatType[] = ["SENT", "RECEIVED"];

type ChatRequestError = {
  message: string;
  retryAfterSeconds: number;
};

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

function toChatListItem(room: AnonymousChatRoomEntity): AnonymousChatListItemData | null {
  if (
    room.counterpartAlias === undefined ||
    room.product?.productId === undefined ||
    room.product.name === undefined ||
    room.lastActiveAt === undefined
  ) {
    return null;
  }

  return {
    roomId: room.roomId,
    counterpartAlias: room.counterpartAlias,
    product: {
      productId: room.product.productId,
      name: room.product.name,
    },
    hasUnreadMessage: room.hasUnreadMessage,
    unreadMessageCount: room.unreadMessageCount,
    lastActiveAt: room.lastActiveAt,
    lastMessage: room.lastMessage ?? null,
  };
}

export default function AnonymousChatsPageContent({ initialType }: AnonymousChatsPageContentProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<AnonymousChatType>(initialType);
  const [requestErrorsByType, setRequestErrorsByType] = useState<
    Partial<Record<AnonymousChatType, ChatRequestError>>
  >({});
  const [loadingTypes, setLoadingTypes] = useState<Set<AnonymousChatType>>(() => new Set());
  // 한 번에 한 대화만 나가기 버튼을 열어 두고, 나가기를 누른 대화는 확인 모달에서 처리함
  const [revealedChatId, setRevealedChatId] = useState<number | null>(null);
  const [leavingChatId, setLeavingChatId] = useState<number | null>(null);
  const requestControllersRef = useRef<Partial<Record<AnonymousChatType, AbortController>>>({});
  const loadingTypesRef = useRef(new Set<AnonymousChatType>());
  const refreshedTypesRef = useRef(new Set<AnonymousChatType>());
  const isRedirectingRef = useRef(false);
  const chatListRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const { showToast } = useToastContext();
  const roomsById = useAnonymousChatStore((state) => state.roomsById);
  const selectedChatIds = useAnonymousChatStore((state) => state.chatIdsByType[selectedType]);
  const selectedPagination = useAnonymousChatStore(
    (state) => state.listPaginationByType[selectedType],
  );
  const selectedChats = useMemo<AnonymousChatsPage | undefined>(() => {
    if (!selectedPagination.isInitialized) return undefined;

    const items = selectedChatIds.flatMap((roomId) => {
      const chat = roomsById[roomId] ? toChatListItem(roomsById[roomId]) : null;

      return chat ? [chat] : [];
    });

    return {
      items,
      nextCursor: selectedPagination.nextCursor,
      hasNext: selectedPagination.hasNext,
    };
  }, [roomsById, selectedChatIds, selectedPagination]);
  const selectedRequestError = requestErrorsByType[selectedType] ?? null;
  const isSelectedTypeLoading = loadingTypes.has(selectedType);
  const tabPanelLabel = selectedType === "RECEIVED" ? "나에게 물어본 대화" : "내가 물어본 대화";

  const loadChats = useCallback(
    async (type: AnonymousChatType, cursor?: string, force = false) => {
      if (loadingTypesRef.current.has(type) && !force) return;

      if (force) {
        requestControllersRef.current[type]?.abort();
      }

      const requestController = new AbortController();

      requestControllersRef.current[type] = requestController;
      loadingTypesRef.current.add(type);
      setLoadingTypes(new Set(loadingTypesRef.current));
      setRequestErrorsByType((current) => ({ ...current, [type]: undefined }));

      try {
        const page = await getAnonymousChats({
          type,
          cursor,
          size: PAGE_SIZE,
          signal: requestController.signal,
        });

        if (requestControllersRef.current[type] !== requestController) return;
        useAnonymousChatStore
          .getState()
          .mergeChatListPage(type, page, cursor ? "append" : "refresh");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        if (requestControllersRef.current[type] !== requestController) return;

        if (error instanceof ApiRequestError && error.status === 401) {
          isRedirectingRef.current = true;
          router.replace("/login");
          return;
        }

        if (
          error instanceof ApiRequestError &&
          error.status === 403 &&
          error.message === ONBOARDING_REQUIRED_MESSAGE
        ) {
          isRedirectingRef.current = true;
          router.replace("/onboarding");
          return;
        }

        setRequestErrorsByType((current) => ({
          ...current,
          [type]: {
            message:
              error instanceof ApiRequestError
                ? error.message
                : "대화 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
            retryAfterSeconds:
              error instanceof ApiRequestError && error.status === 429
                ? (error.retryAfterSeconds ?? 0)
                : 0,
          },
        }));
      } finally {
        if (requestControllersRef.current[type] === requestController) {
          delete requestControllersRef.current[type];
          loadingTypesRef.current.delete(type);
          setLoadingTypes(new Set(loadingTypesRef.current));
        }
      }
    },
    [router],
  );

  // 탭을 처음 열 때 첫 페이지를 갱신해 화면 밖에서 새로 생긴 대화방도 목록에 반영함
  useEffect(() => {
    if (
      isRedirectingRef.current ||
      selectedRequestError ||
      refreshedTypesRef.current.has(selectedType)
    ) {
      return;
    }

    refreshedTypesRef.current.add(selectedType);
    void loadChats(selectedType, undefined, true);
  }, [loadChats, selectedRequestError, selectedType]);

  useEffect(() => {
    const handleEvent = (event: AnonymousChatEvent) => {
      if (
        event.type !== "ANONYMOUS_CHAT_MESSAGE_SENT" &&
        event.type !== "ANONYMOUS_CHAT_MESSAGE_RECEIVED"
      ) {
        return;
      }

      const state = useAnonymousChatStore.getState();
      const room = state.roomsById[event.data.roomId];
      const isListed =
        room?.type !== undefined && state.chatIdsByType[room.type].includes(event.data.roomId);

      if (isListed) return;

      CHAT_TYPES.forEach((type) => {
        refreshedTypesRef.current.add(type);
        void loadChats(type, undefined, true);
      });
    };

    return addAnonymousChatEventHandler(handleEvent);
  }, [loadChats]);

  useEffect(() => {
    const loadingTypes = loadingTypesRef.current;

    return () => {
      Object.values(requestControllersRef.current).forEach((controller) => controller?.abort());
      requestControllersRef.current = {};
      loadingTypes.clear();
    };
  }, []);

  useEffect(() => {
    if (!selectedRequestError || selectedRequestError.retryAfterSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRequestErrorsByType((current) => {
        const currentError = current[selectedType];

        if (!currentError) {
          window.clearInterval(timer);
          return current;
        }

        return {
          ...current,
          [selectedType]: {
            ...currentError,
            retryAfterSeconds: Math.max(0, currentError.retryAfterSeconds - 1),
          },
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [selectedRequestError, selectedType]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = chatListRef.current;

    if (
      !sentinel ||
      !scrollContainer ||
      !selectedChats?.hasNext ||
      !selectedChats.nextCursor ||
      isSelectedTypeLoading ||
      selectedRequestError ||
      isRedirectingRef.current
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadChats(selectedType, selectedChats.nextCursor ?? undefined);
        }
      },
      { root: scrollContainer, rootMargin: "200px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isSelectedTypeLoading, loadChats, selectedChats, selectedRequestError, selectedType]);

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
  const handleLeft = (roomId: number) => {
    useAnonymousChatStore.getState().removeRoom(roomId);
    setLeavingChatId(null);
    setRevealedChatId(null);
    showToast("채팅방을 나갔어요.");
  };

  const renderChatList = () => {
    if (!selectedChats && selectedRequestError) {
      return (
        <div className="pt-8 text-center">
          <p role="alert" className="text-body-sm text-danger">
            {selectedRequestError.message}
          </p>
          <button
            type="button"
            disabled={selectedRequestError.retryAfterSeconds > 0}
            className="mt-2 rounded-sm border border-border-strong bg-surface px-4 py-2 text-body-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void loadChats(selectedType)}
          >
            {selectedRequestError.retryAfterSeconds > 0
              ? `${selectedRequestError.retryAfterSeconds}초 후 다시 시도`
              : "다시 시도"}
          </button>
        </div>
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
            key={chat.roomId}
            chat={chat}
            isLeaveRevealed={revealedChatId === chat.roomId}
            onRevealLeave={setRevealedChatId}
            onLeave={setLeavingChatId}
          />
        ))}

        {selectedChats.hasNext && selectedChats.nextCursor && !selectedRequestError && (
          <li ref={sentinelRef} aria-hidden="true" className="h-px" />
        )}

        {isSelectedTypeLoading && (
          <li role="status" className="py-4 text-center text-body-sm text-muted">
            대화 목록을 불러오는 중이에요.
          </li>
        )}

        {selectedRequestError && (
          <li className="py-4 text-center">
            <p role="alert" className="text-body-sm text-danger">
              {selectedRequestError.message}
            </p>
            <button
              type="button"
              disabled={selectedRequestError.retryAfterSeconds > 0}
              className="mt-2 rounded-sm border border-border-strong bg-surface px-4 py-2 text-body-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void loadChats(selectedType, selectedChats.nextCursor ?? undefined)}
            >
              {selectedRequestError.retryAfterSeconds > 0
                ? `${selectedRequestError.retryAfterSeconds}초 후 다시 시도`
                : "다시 시도"}
            </button>
          </li>
        )}
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
        ref={chatListRef}
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
