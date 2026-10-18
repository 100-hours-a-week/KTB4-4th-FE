// 친구 상세 화면과 헤더가 하나의 상세 조회 결과를 공유하는 Context
"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { FriendDetail, FriendFavorite } from "@/lib/api/friends";

type FriendDetailContextValue = {
  friend: FriendDetail | null;
  initializeFriend: (friend: FriendDetail) => void;
  updateFavorite: (favorite: FriendFavorite) => void;
};

const FriendDetailContext = createContext<FriendDetailContextValue | null>(null);

export function FriendDetailProvider({ children }: { children: ReactNode }) {
  const [friend, setFriend] = useState<FriendDetail | null>(null);

  const initializeFriend = useCallback((initialFriend: FriendDetail) => {
    setFriend(initialFriend);
  }, []);

  const updateFavorite = useCallback((favorite: FriendFavorite) => {
    setFriend((currentFriend) =>
      currentFriend?.id === favorite.userId
        ? { ...currentFriend, isFavorite: favorite.isFavorite }
        : currentFriend,
    );
  }, []);

  const value = useMemo(
    () => ({ friend, initializeFriend, updateFavorite }),
    [friend, initializeFriend, updateFavorite],
  );

  return <FriendDetailContext value={value}>{children}</FriendDetailContext>;
}

export function useFriendDetailContext() {
  const context = useContext(FriendDetailContext);

  if (!context) {
    throw new Error("useFriendDetailContext는 FriendDetailProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
