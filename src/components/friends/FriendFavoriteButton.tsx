// 친구 즐겨찾기 상태를 표시하고 변경하는 공통 버튼

type FriendFavoriteButtonProps = {
  name?: string;
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
};

export default function FriendFavoriteButton({
  name,
  isFavorite,
  onToggle,
  className = "",
}: FriendFavoriteButtonProps) {
  const friendLabel = name ? `${name} ` : "";

  return (
    <button
      type="button"
      aria-label={`${friendLabel}즐겨찾기 ${isFavorite ? "해제" : "설정"}`}
      aria-pressed={isFavorite}
      onClick={onToggle}
      className={`touch-target flex shrink-0 items-center justify-center border-0 bg-transparent p-0 transition-colors ${
        isFavorite ? "text-primary" : "text-muted"
      } ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
        <path
          d="m12 2.75 2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.32l-5.7 3 1.09-6.36-4.62-4.5 6.38-.93L12 2.75Z"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
