// 선택된 친구 분류 내에서 친구를 검색하는 입력 필드
"use client";

import { useState, type FormEvent } from "react";

type FriendSearchFieldProps = {
  isFavorite: boolean;
};

export default function FriendSearchField({ isFavorite }: FriendSearchFieldProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchScopeLabel = isFavorite ? "즐겨찾는 친구" : "전체 친구";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // TODO: 돋보기 아이콘 클릭 또는 Enter 입력 시 친구 검색 API 호출
    // 전체 친구 탭에서는 전체 친구 목록 내에서, 즐겨찾는 친구 탭에서는 즐겨찾는 친구 목록 내에서 검색
  };

  return (
    <form role="search" aria-label={`${searchScopeLabel} 검색`} onSubmit={handleSubmit}>
      <label htmlFor="friend-search" className="sr-only">
        {searchScopeLabel} 검색어
      </label>
      <div className="relative">
        <input
          id="friend-search"
          type="text"
          inputMode="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="검색어를 입력해주세요."
          className="h-14 w-full appearance-none rounded-md border-0 bg-background-subtle px-5 pr-14 text-body-lg text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label={`${searchScopeLabel} 검색`}
          className="touch-target absolute top-1/2 right-1 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
