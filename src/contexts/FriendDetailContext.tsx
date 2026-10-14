// 친구 상세 화면과 헤더가 하나의 상세 조회 결과를 공유하는 Context
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiRequestError } from "@/lib/api/client";
import { getFriendDetail, type FriendDetail, type FriendFavorite } from "@/lib/api/friends";

type FriendDetailContextValue = {
  friend: FriendDetail | null;
  updateFavorite: (favorite: FriendFavorite) => void;
};

const FriendDetailContext = createContext<FriendDetailContextValue | null>(null);
const friendDetailPathPattern = /^\/friends\/(\d+)\/?$/;
const pendingFriendDetailRequests = new Map<number, Promise<FriendDetail>>();

function getFriendUserId(pathname: string) {
  const match = pathname.match(friendDetailPathPattern);

  return match ? Number(match[1]) : null;
}

// 개발 모드 Strict Mode의 Effect 재실행과 여러 소비자의 동시 요청을 하나의 요청으로 합침
function getSharedFriendDetail(userId: number) {
  const pendingRequest = pendingFriendDetailRequests.get(userId);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = getFriendDetail(userId);
  pendingFriendDetailRequests.set(userId, request);
  void request.then(
    () => pendingFriendDetailRequests.delete(userId),
    () => pendingFriendDetailRequests.delete(userId),
  );

  return request;
}

export function FriendDetailProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const userId = getFriendUserId(pathname);
  const [friend, setFriend] = useState<FriendDetail | null>(null);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let isActive = true;

    const loadFriendDetail = async () => {
      try {
        const data = await getSharedFriendDetail(userId);

        if (isActive) {
          setFriend(data);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        router.replace(
          error instanceof ApiRequestError && error.status === 401 ? "/login" : "/error",
        );
      }
    };

    void loadFriendDetail();

    return () => {
      isActive = false;
    };
  }, [router, userId]);

  const updateFavorite = useCallback((favorite: FriendFavorite) => {
    setFriend((currentFriend) =>
      currentFriend?.id === favorite.userId
        ? { ...currentFriend, isFavorite: favorite.isFavorite }
        : currentFriend,
    );
  }, []);

  const value = useMemo(() => ({ friend, updateFavorite }), [friend, updateFavorite]);

  return <FriendDetailContext value={value}>{children}</FriendDetailContext>;
}

export function useFriendDetailContext() {
  const context = useContext(FriendDetailContext);

  if (!context) {
    throw new Error("useFriendDetailContext는 FriendDetailProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
