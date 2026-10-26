// 일정 상세 상단의 케밥 버튼과 수정하기·삭제하기 드롭다운 메뉴
"use client";

import { useEffect, useId, useRef, useState } from "react";

type CalendarEventActionMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export default function CalendarEventActionMenu({
  onEdit,
  onDelete,
}: CalendarEventActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);

    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [isOpen]);

  const handleMenuItemClick = (action?: () => void) => {
    setIsOpen(false);
    action?.();
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !isOpen) return;

        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
      }}
    >
      <button
        type="button"
        aria-label="일정 메뉴"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className="touch-target flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground transition-colors active:bg-background-subtle"
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
      >
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
      </button>

      {isOpen && (
        <ul
          id={menuId}
          role="menu"
          aria-label="일정 메뉴"
          className="absolute top-full right-0 z-10 m-0 min-w-32 list-none overflow-hidden rounded-md border border-border-strong bg-surface p-0 shadow-lg"
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center border-0 bg-transparent px-4 text-left text-foreground transition-colors active:bg-background-subtle"
              onClick={() => handleMenuItemClick(onEdit)}
            >
              <span className="text-body">수정하기</span>
            </button>
          </li>
          <li role="none" className="border-t border-border">
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center border-0 bg-transparent px-4 text-left text-danger transition-colors active:bg-background-subtle"
              onClick={() => handleMenuItemClick(onDelete)}
            >
              <span className="text-body">삭제하기</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
