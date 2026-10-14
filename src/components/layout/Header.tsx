// 현재 페이지에 맞는 탐색 기능을 제공하는 공통 헤더
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import FriendFavoriteButton from "@/components/friends/FriendFavoriteButton";
import { useFriendDetailContext } from "@/contexts/FriendDetailContext";
import { ApiRequestError } from "@/lib/api/client";
import { updateFriendFavorite } from "@/lib/api/friends";

import NotificationDropdown from "./NotificationDropdown";
import Sidebar, { type SidebarAnimationState } from "./Sidebar";

const pathsWithoutBackButton = new Set(["/", "/friends"]);
const sidebarId = "main-sidebar";
const friendDetailPathPattern = /^\/friends\/\d+\/?$/;

type FriendDetailHeaderActionProps = {
  userId: number;
};

type FavoriteRequestError = {
  message: string;
  retryAfterSeconds: number;
};

function FriendDetailHeaderAction({ userId }: FriendDetailHeaderActionProps) {
  const router = useRouter();
  const { friend, updateFavorite } = useFriendDetailContext();
  const [isPending, setIsPending] = useState(false);
  const [requestError, setRequestError] = useState<FavoriteRequestError | null>(null);
  const isFavorite = friend?.id === userId ? friend.isFavorite : null;

  useEffect(() => {
    if (!requestError || requestError.retryAfterSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRequestError((currentError) => {
        if (!currentError || currentError.retryAfterSeconds <= 1) {
          window.clearInterval(timer);
          return currentError ? { ...currentError, retryAfterSeconds: 0 } : null;
        }

        return {
          ...currentError,
          retryAfterSeconds: currentError.retryAfterSeconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [requestError]);

  const handleToggleFavorite = async () => {
    if (
      isFavorite === null ||
      isPending ||
      (requestError !== null && requestError.retryAfterSeconds > 0)
    ) {
      return;
    }

    setIsPending(true);
    setRequestError(null);

    try {
      const updatedFavorite = await updateFriendFavorite(userId, !isFavorite);

      updateFavorite(updatedFavorite);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setRequestError({
        message:
          error instanceof ApiRequestError
            ? error.message
            : "즐겨찾기를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        retryAfterSeconds:
          error instanceof ApiRequestError && error.status === 429
            ? (error.retryAfterSeconds ?? 0)
            : 0,
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <FriendFavoriteButton
        isFavorite={isFavorite ?? false}
        isPending={isPending}
        disabled={
          isFavorite === null || (requestError !== null && requestError.retryAfterSeconds > 0)
        }
        onToggle={() => void handleToggleFavorite()}
        className="absolute right-page"
      />
      {requestError && (
        <p
          role="alert"
          className="absolute top-[calc(100%+4px)] right-page z-20 max-w-[280px] rounded-sm bg-danger-subtle px-3 py-2 text-right text-caption text-danger shadow-sm"
        >
          {requestError.message}
          {requestError.retryAfterSeconds > 0 &&
            ` ${requestError.retryAfterSeconds}초 후 다시 시도해 주세요.`}
        </p>
      )}
    </>
  );
}

function HomeHeaderActions() {
  const [sidebarState, setSidebarState] = useState<SidebarAnimationState>("closed");
  const isSidebarVisible = sidebarState !== "closed";

  return (
    <>
      <button
        type="button"
        aria-label={isSidebarVisible ? "사이드바 닫기" : "사이드바 열기"}
        aria-controls={sidebarId}
        aria-expanded={sidebarState === "open"}
        className="touch-target absolute right-page z-[70] flex items-center justify-end border-0 bg-transparent p-0 text-foreground"
        onClick={() =>
          setSidebarState((currentState) => (currentState === "open" ? "closing" : "open"))
        }
      >
        {isSidebarVisible ? (
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6H20M4 12H20M4 18H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      <NotificationDropdown />
      <Sidebar
        id={sidebarId}
        state={sidebarState}
        onClose={() => setSidebarState("closing")}
        onClosed={() => setSidebarState("closed")}
      />
    </>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const friendDetailMatch = pathname.match(friendDetailPathPattern);
  const friendUserId = friendDetailMatch ? Number(pathname.split("/")[2]) : null;
  const showBackButton = !pathsWithoutBackButton.has(pathname);

  return (
    <header className="relative flex h-[60px] shrink-0 items-center justify-center bg-surface px-page">
      {isHomePage && <HomeHeaderActions />}

      {friendUserId !== null && <FriendDetailHeaderAction key={pathname} userId={friendUserId} />}

      {!isHomePage && showBackButton && (
        <button
          type="button"
          aria-label="뒤로 가기"
          className="touch-target absolute left-page flex items-center justify-start border-0 bg-transparent p-0 text-foreground"
          onClick={() => router.back()}
        >
          <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} priority />
        </button>
      )}

      <Link href="/" className="touch-target flex items-center justify-center">
        <Image src="/images/NeedU_logo.png" alt="NeedU" width={80} height={21} priority />
      </Link>
    </header>
  );
}
