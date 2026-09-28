// 현재 페이지에 맞는 탐색 기능을 제공하는 공통 헤더
"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const pathsWithoutBackButton = new Set(["/", "/friends"]);

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const showBackButton = !pathsWithoutBackButton.has(pathname);

  return (
    <header className="relative flex h-[60px] shrink-0 items-center justify-center bg-surface px-page">
      {showBackButton && (
        <button
          type="button"
          aria-label="뒤로 가기"
          className="touch-target absolute left-page flex items-center justify-start border-0 bg-transparent p-0 text-foreground"
          onClick={() => router.back()}
        >
          <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} priority />
        </button>
      )}

      <Image
        src="/images/NeedU_logo.png"
        alt="NeedU"
        width={80}
        height={21}
        priority
      />
    </header>
  );
}
