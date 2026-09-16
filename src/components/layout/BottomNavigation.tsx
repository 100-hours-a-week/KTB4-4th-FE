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
  { label: "AI", href: "/ai", icon: "/icons/icon-ai.svg" },
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

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-md text-caption font-semibold transition-colors ${
                  isActive ? "text-foreground" : "text-muted"
                }`}
              >
                <Image
                  src={isActive ? activeIcon : icon}
                  alt=""
                  width={28}
                  height={28}
                  className={isActive ? "opacity-100" : "opacity-40"}
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
