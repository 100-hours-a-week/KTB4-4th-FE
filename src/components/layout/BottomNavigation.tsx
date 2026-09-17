"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <nav aria-label="하단 메뉴" className="z-10 shrink-0 border-t border-border bg-surface">
      <ul className="flex list-none justify-between px-[10px] pt-[6px] pb-[max(10px,env(safe-area-inset-bottom))]">
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
                className={
                  isFeatured
                    ? `-mt-5 flex h-[68px] w-[104px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-border-strong bg-surface text-caption font-bold text-foreground shadow-md transition-shadow ${
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
