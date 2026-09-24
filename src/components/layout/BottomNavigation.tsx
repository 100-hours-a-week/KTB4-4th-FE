// 주요 화면 이동과 AI 대화 시작을 제공하는 하단 내비게이션
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import useAiConversationStart from "@/hooks/useAiConversationStart";

import type { MouseEvent } from "react";

const navigationItems = [
  {
    label: "홈",
    href: "/",
    icon: "/icons/icon-home.svg",
    activeIcon: "/icons/icon-home-filled.svg",
  },
  { label: "AI", href: "/ai", icon: "/icons/icon-ai.svg", featured: true },
  { label: "친구", href: "/friends", icon: "/icons/icon-user.svg" },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();
  const {
    errorMessage,
    isStartingConversation,
    isUnavailable,
    retryAfterSeconds,
    startConversation,
  } = useAiConversationStart();

  const handleAiClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void startConversation();
  };

  if (pathname === "/ai") return null;

  return (
    <nav
      aria-label="하단 메뉴"
      className="relative z-10 shrink-0 border-t border-border-strong bg-surface"
    >
      {errorMessage && (
        <p
          role="alert"
          className="absolute right-4 bottom-[calc(100%+0.5rem)] left-4 rounded-sm bg-danger-subtle px-3 py-2 text-center text-body-sm text-danger shadow-sm"
        >
          {errorMessage}
          {retryAfterSeconds > 0 && ` (${retryAfterSeconds}초 후 다시 시도해 주세요.)`}
        </p>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-9 left-1/2 h-9 w-[120px] -translate-x-1/2 rounded-t-[60px] border-x border-t border-border-strong bg-surface"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-px left-1/2 h-2 w-[118px] -translate-x-1/2 bg-surface"
      />

      <ul className="relative z-10 flex list-none justify-between px-[10px] pt-[6px] pb-[max(10px,env(safe-area-inset-bottom))]">
        {navigationItems.map((item) => {
          const { label, href, icon } = item;
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
          const activeIcon = "activeIcon" in item ? item.activeIcon : icon;
          const isFeatured = "featured" in item && item.featured;

          return (
            <li key={href} className="flex flex-1 justify-center">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={isFeatured && isUnavailable ? true : undefined}
                aria-busy={isFeatured && isStartingConversation ? true : undefined}
                onClick={isFeatured ? handleAiClick : undefined}
                className={
                  isFeatured
                    ? `-mt-8 flex h-[68px] w-[104px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-border-strong bg-surface text-caption font-bold text-foreground shadow-md transition-shadow ${
                        isActive ? "ring-2 ring-foreground/15" : ""
                      }`
                    : `flex min-h-[54px] w-full flex-col items-center justify-center gap-0.5 rounded-md text-caption font-semibold transition-colors ${
                        isActive ? "text-foreground" : "text-muted"
                      }`
                }
              >
                <Image
                  src={isActive ? activeIcon : icon}
                  alt=""
                  width={isFeatured ? 32 : 28}
                  height={isFeatured ? 32 : 28}
                  className={isFeatured || isActive ? "opacity-100" : "opacity-40"}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
