// 친구에게 콕찌르기 알림을 보내기 위한 버튼 UI

type FriendPokeButtonProps = {
  nickname: string;
};

// TODO: 콕찌르기 API 연동 시 클릭 처리와 요청 상태 UI 추가
export default function FriendPokeButton({ nickname }: FriendPokeButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex h-11 w-fit cursor-pointer items-center justify-center gap-1.5 rounded-full border border-foreground bg-foreground px-5 text-center text-background"
    >
      <strong className="text-body-sm font-bold">
        {nickname}님 <span className="text-primary">콕</span>찌르기
      </strong>
    </button>
  );
}
