// 친구의 이름과 기념일 정보를 표시하는 목록 카드

type FriendCardProps = {
  name: string;
  detail: string;
  highlightDetail?: boolean;
};

export default function FriendCard({ name, detail, highlightDetail = false }: FriendCardProps) {
  // TODO: 카드 선택 동작이 정해지면 전체 카드를 Link 또는 button으로 전환하고 키보드 포커스 스타일 적용
  return (
    <article className="flex min-h-12 items-center gap-3 bg-surface">
      <div
        aria-hidden="true"
        className="h-12 w-12 shrink-0 overflow-hidden rounded-[35%] bg-background-subtle"
      />
      <div className="min-w-0">
        <p className="text-[18px] leading-6 font-medium text-foreground">{name}</p>
        <p className={`mt-0.5 text-body-sm ${highlightDetail ? "text-[#f05a28]" : "text-muted"}`}>
          {detail}
        </p>
      </div>
    </article>
  );
}
