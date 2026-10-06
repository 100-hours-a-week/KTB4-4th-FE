// 마이페이지의 취향 또는 관심사 키워드 배지 목록

type KeywordSectionProps = {
  category: "취향" | "관심사";
  nickname: string;
  keywords: string[];
};

export default function KeywordSection({ category, nickname, keywords }: KeywordSectionProps) {
  const headingId = `recent-${category}-heading`;

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="flex min-w-0 items-baseline whitespace-nowrap text-heading-3 font-bold text-foreground"
      >
        <span className="shrink-0">최근&nbsp;</span>
        <span className="min-w-0 truncate text-info">{nickname}</span>
        <span className="shrink-0">님의 {category}</span>
      </h2>
      <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
        {keywords.map((keyword) => (
          <li
            key={keyword}
            className="rounded-full border border-brand-100 bg-warning-subtle px-3 py-1 text-caption font-bold text-foreground-secondary"
          >
            {keyword}
          </li>
        ))}
      </ul>
    </section>
  );
}
