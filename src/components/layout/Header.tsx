"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  return (
    <header className="relative flex h-[60px] shrink-0 items-center justify-center bg-surface px-page">
      <button
        type="button"
        aria-label="뒤로 가기"
        className="touch-target absolute left-page flex items-center justify-start border-0 bg-transparent p-0 text-foreground"
        onClick={() => router.back()}
      >
        <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} priority />
      </button>

      <strong className="text-heading-3 font-bold" aria-label="Need U">
        Need U
      </strong>
    </header>
  );
}
