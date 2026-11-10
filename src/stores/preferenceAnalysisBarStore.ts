// AI 취향 분석 진행률 카드의 표시 상태 관리 스토어

import { create } from "zustand";
import { persist } from "zustand/middleware";

type PreferenceAnalysisBarState = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

export const usePreferenceAnalysisBarStore = create<PreferenceAnalysisBarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: "preference-analysis-bar",
      partialize: ({ isCollapsed }) => ({ isCollapsed }),
      skipHydration: true,
      version: 1,
    },
  ),
);
