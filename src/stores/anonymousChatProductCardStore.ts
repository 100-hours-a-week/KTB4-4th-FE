// 채팅방 선물 후보 상품 카드의 접힘 상태 관리 스토어

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AnonymousChatProductCardState = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

export const useAnonymousChatProductCardStore = create<AnonymousChatProductCardState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: "anonymous-chat-product-card",
      partialize: ({ isCollapsed }) => ({ isCollapsed }),
      skipHydration: true,
      version: 1,
    },
  ),
);
