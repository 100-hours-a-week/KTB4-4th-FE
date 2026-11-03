// 익명 대화 상대 이름의 표시 여부를 판단하는 유틸 함수

export const UNKNOWN_ALIAS_LABEL = "(알 수 없음)";

// 상대가 탈퇴하는 등 이름이 비어 있으면 null을 반환함
export function getDisplayAlias(name: string | null | undefined) {
  return name?.trim() || null;
}
