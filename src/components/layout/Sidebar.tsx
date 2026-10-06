// 홈페이지의 주요 메뉴와 로그아웃 기능을 제공하는 사이드바

"use client";

import Image from "next/image";
import { useEffect, useId } from "react";

import useDialogControl from "@/hooks/useDialogControl";

import styles from "./Sidebar.module.css";

type SidebarProps = {
  id: string;
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ id, open, onClose }: SidebarProps) {
  const dialogRef = useDialogControl({ open, mode: "non-modal" });
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  const handleMyPageClick = () => {
    // TODO: 마이페이지 구현 후 해당 페이지로 이동
  };

  const handleSettingsClick = () => {
    // TODO: 설정 페이지 구현 후 해당 페이지로 이동
  };

  const handleLogoutClick = () => {
    // TODO: 로그아웃 API 구현 후 로그아웃 처리
  };

  return (
    <dialog
      id={id}
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
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
            <li>
              <button
                type="button"
                className={`${styles.menuButton} flex w-full items-center border-0 bg-transparent px-3 py-3 text-left text-body-lg font-bold text-foreground`}
                onClick={handleMyPageClick}
              >
                마이페이지
              </button>
            </li>
            <li>
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
          className={`${styles.menuButton} mt-auto flex w-full items-center border-0 bg-transparent px-3 py-3 text-left text-body-lg font-bold text-danger`}
          onClick={handleLogoutClick}
        >
          로그아웃
        </button>
      </div>
    </dialog>
  );
}
