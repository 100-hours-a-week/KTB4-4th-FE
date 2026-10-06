// 현재 페이지에 맞는 탐색 기능을 제공하는 공통 헤더
"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import NotificationDropdown from "./NotificationDropdown";
import Sidebar from "./Sidebar";

const pathsWithoutBackButton = new Set(["/", "/friends"]);
const sidebarId = "main-sidebar";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isHomePage = pathname === "/";
  const showBackButton = !pathsWithoutBackButton.has(pathname);

  return (
    <header className="relative flex h-[60px] shrink-0 items-center justify-center bg-surface px-page">
      {isHomePage && (
        <button
          type="button"
          aria-label={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
          aria-controls={sidebarId}
          aria-expanded={isSidebarOpen}
          className="touch-target absolute left-page z-[70] flex items-center justify-start border-0 bg-transparent p-0 text-foreground"
          onClick={() => setIsSidebarOpen((currentIsOpen) => !currentIsOpen)}
        >
          {isSidebarOpen ? (
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
      )}

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

      <Image src="/images/NeedU_logo.png" alt="NeedU" width={80} height={21} priority />

      {isHomePage && (
        <>
          <NotificationDropdown />
          <Sidebar id={sidebarId} open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
      )}
    </header>
  );
}
