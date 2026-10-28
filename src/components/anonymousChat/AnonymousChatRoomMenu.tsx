// 채팅방 헤더의 케밥 버튼과 신고하기·채팅방 나가기 메뉴 드롭다운
"use client";

import { useEffect, useId, useRef, useState } from "react";

type AnonymousChatRoomMenuProps = {
  onReport: () => void;
  onLeave: () => void;
};

function ReportIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 8V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17L21 12L16 7M21 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AnonymousChatRoomMenu({ onReport, onLeave }: AnonymousChatRoomMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const menuItems = [
    {
      label: "신고하기",
      icon: <ReportIcon />,
      onSelect: onReport,
      colorClassName: "text-foreground",
    },
    {
      label: "채팅방 나가기",
      icon: <LeaveIcon />,
      onSelect: onLeave,
      colorClassName: "text-danger",
    },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={isOpen ? "대화 메뉴 닫기" : "대화 메뉴 열기"}
        aria-controls={menuId}
        aria-expanded={isOpen}
        className="touch-target flex items-center justify-end border-0 bg-transparent p-0 text-foreground"
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
      >
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {isOpen && (
        <ul
          id={menuId}
          className="absolute top-[calc(100%+0.25rem)] right-0 z-50 m-0 w-44 list-none overflow-hidden rounded-md border border-border-strong bg-surface p-1 shadow-lg"
        >
          {menuItems.map(({ label, icon, onSelect, colorClassName }) => (
            <li key={label}>
              <button
                type="button"
                className={`flex h-touch w-full items-center gap-3 rounded-sm border-0 bg-transparent px-3 text-left text-body transition-colors hover:bg-background-subtle ${colorClassName}`}
                onClick={() => {
                  setIsOpen(false);
                  onSelect();
                }}
              >
                {icon}
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
