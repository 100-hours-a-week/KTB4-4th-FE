// 주요 화면 이동과 AI 대화 시작을 제공하는 하단 내비게이션
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import useAiConversationStart from "@/hooks/useAiConversationStart";

import styles from "./BottomNavigation.module.css";

import type { MouseEvent } from "react";

const navigationItems = [
  {
    label: "홈",
    href: "/",
    icon: "/icons/icon-home.svg",
    activeIcon: "/icons/icon-home-filled.svg",
  },
  {
    label: "AI",
    href: "/ai",
    icon: "/icons/icon-ai.svg",
    caption: "AI",
    startsConversation: true,
  },
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
      className="relative z-10 shrink-0"
    >
      {errorMessage && (
        <p
          role="alert"
          className="absolute right-4 bottom-[calc(100%+2.5rem)] left-4 z-20 rounded-sm bg-danger-subtle px-3 py-2 text-center text-body-sm text-danger shadow-sm"
        >
          {errorMessage}
          {retryAfterSeconds > 0 && ` (${retryAfterSeconds}초 후 다시 시도해 주세요.)`}
        </p>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-9 left-1/2 z-0 h-[88px] w-[88px] -translate-x-1/2 rounded-full border border-border bg-surface shadow-sm"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-surface"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-[calc(50%+44px)] left-0 z-[2] border-t border-border"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 left-[calc(50%+44px)] z-[2] border-t border-border"
      />
      <ul className="relative z-10 flex list-none justify-between px-[10px] pt-[6px] pb-[max(10px,env(safe-area-inset-bottom))]">
        {navigationItems.map((item) => {
          const { label, href, icon } = item;
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
          const activeIcon = "activeIcon" in item ? item.activeIcon : icon;
          const caption = "caption" in item ? item.caption : undefined;
          const startsConversation =
            "startsConversation" in item && item.startsConversation;

          return (
            <li key={href} className="flex flex-1 justify-center">
              <Link
                href={href}
                aria-label={startsConversation ? "AI 대화 시작" : undefined}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={startsConversation && isUnavailable ? true : undefined}
                aria-busy={startsConversation && isStartingConversation ? true : undefined}
                onClick={startsConversation ? handleAiClick : undefined}
                className={
                  startsConversation
                    ? `-mt-8 flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center gap-0 rounded-full border-2 border-border-strong bg-primary text-caption font-bold text-foreground shadow-md transition-shadow ${
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
                  width={28}
                  height={28}
                  className={
                    startsConversation
                      ? styles.aiIconReveal
                      : isActive
                        ? "opacity-100"
                        : "opacity-40"
                  }
                />
                {caption && (
                  <strong aria-hidden="true" className="text-caption font-bold">
                    {caption}
                  </strong>
                )}
                {!startsConversation && <span>{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
