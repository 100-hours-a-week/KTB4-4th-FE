// 익명 대화 상대 이름을 표시하고, 이름이 없으면 회색 알 수 없음 문구로 대체하는 컴포넌트

import { getDisplayAlias, UNKNOWN_ALIAS_LABEL } from "@/lib/anonymousChatAlias";

type AnonymousChatAliasProps = {
  name: string | null;
  className?: string;
};

export default function AnonymousChatAlias({ name, className }: AnonymousChatAliasProps) {
  const displayAlias = getDisplayAlias(name);

  if (displayAlias === null) {
    return <span className="text-muted">{UNKNOWN_ALIAS_LABEL}</span>;
  }

  return <span className={className}>{displayAlias}</span>;
}
