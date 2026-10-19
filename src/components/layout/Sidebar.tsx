// 홈페이지의 주요 메뉴와 로그아웃 기능을 제공하는 사이드바

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";

import useDialogControl from "@/hooks/useDialogControl";
import useLogout from "@/hooks/useLogout";

import styles from "./Sidebar.module.css";

type SidebarProps = {
  id: string;
  state: SidebarAnimationState;
  onClose: () => void;
  onClosed: () => void;
};

export type SidebarAnimationState = "closed" | "open" | "closing";

export default function Sidebar({ id, state, onClose, onClosed }: SidebarProps) {
  const router = useRouter();
  const dialogRef = useDialogControl({
    open: state !== "closed",
    mode: "non-modal",
  });
  const titleId = useId();
  const { isPending: isLoggingOut, logout } = useLogout();

  useEffect(() => {
    if (state !== "open") return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, state]);

  const handleMyPageClick = () => {
    router.push("/mypage");
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  // 로그아웃 실패 토스트가 전체 화면 사이드바에 가려지지 않도록 사이드바를 닫음
  const handleLogoutClick = async () => {
    const isLoggedOut = await logout();

    if (!isLoggedOut) onClose();
  };

  return (
    <dialog
      id={id}
      ref={dialogRef}
      data-state={state}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && state === "closing") {
          onClosed();
        }
      }}
      className={`${styles.sidebar} absolute z-[60] m-0 h-dvh max-h-none w-full max-w-none border-0 bg-surface p-0 text-foreground`}
    >
      <div className="flex h-full flex-col px-page py-4">
        <div className="flex min-h-touch items-center justify-center">
          <h2 id={titleId} className="m-0">
            <Image src="/images/NeedU_logo.png" alt="NeedU 메뉴" width={80} height={21} />
          </h2>
        </div>

        <nav aria-label="사용자 메뉴" className="mt-8">
          <ul className="m-0 list-none p-0">
            <li className={styles.menuItem}>
              <button
                type="button"
                className={`${styles.menuButton} flex w-full items-center border-0 bg-transparent px-3 py-3 text-left text-body-lg font-bold text-foreground`}
                onClick={handleMyPageClick}
              >
                마이페이지
              </button>
            </li>
            <li className={styles.menuItem}>
              <button
                type="button"
                className={`${styles.menuButton} flex w-full items-center border-0 bg-transparent px-3 py-3 text-left text-body-lg font-bold text-foreground`}
                onClick={handleSettingsClick}
              >
                설정
              </button>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className={`${styles.logoutButton} ${styles.menuButton} mt-auto flex w-full items-center border-0 bg-transparent px-3 py-3 text-left text-body-lg font-bold text-danger disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={isLoggingOut}
          onClick={handleLogoutClick}
        >
          로그아웃
        </button>
      </div>
    </dialog>
  );
}
