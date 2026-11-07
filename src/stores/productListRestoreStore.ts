// 뒤로 가기 복원을 위한 상품 목록 방문 기록별 필터와 스크롤 위치 관리 스토어

import { create } from "zustand";

import type {
  AvailablePriceRangeState,
  PriceRange,
} from "@/components/recommendations/PriceRangeSlider";

const HISTORY_ENTRY_KEY = "__productListEntryKey";
const MAX_ENTRY_COUNT = 20;

export type ProductListPriceRangeScope = "private" | "shared" | "friend";

export type ProductListPriceRangeState = {
  available: AvailablePriceRangeState;
  selected: PriceRange | null;
  applied: PriceRange | null;
};

export const INITIAL_PRODUCT_LIST_PRICE_RANGE_STATE: ProductListPriceRangeState = {
  available: { status: "loading" },
  selected: null,
  applied: null,
};

export type ProductListFilterState = {
  selectedCategoryCode: string;
  priceRanges: Partial<Record<ProductListPriceRangeScope, ProductListPriceRangeState>>;
};

type ProductListFilterEntry = {
  listId: string;
  filter: ProductListFilterState;
};

type ProductListScrollEntry = {
  listId: string;
  scrollTop: number;
};

type ProductListRestoreStoreState = {
  filterEntries: Record<string, ProductListFilterEntry>;
  scrollEntries: Record<string, ProductListScrollEntry>;
  saveFilterEntry: (entryKey: string, entry: ProductListFilterEntry) => void;
  saveScrollEntry: (entryKey: string, entry: ProductListScrollEntry) => void;
  clearEntries: () => void;
};

// 객체의 키 순서를 저장 순서로 사용하므로 기존 항목을 지운 뒤 맨 뒤에 다시 추가함
const keepRecentEntries = <Entry>(
  entries: Record<string, Entry>,
  entryKey: string,
  entry: Entry,
): Record<string, Entry> => {
  const { [entryKey]: _previousEntry, ...otherEntries } = entries;

  return Object.fromEntries(
    Object.entries({ ...otherEntries, [entryKey]: entry }).slice(-MAX_ENTRY_COUNT),
  );
};

const useProductListRestoreStore = create<ProductListRestoreStoreState>()((set) => ({
  filterEntries: {},
  scrollEntries: {},
  saveFilterEntry: (entryKey, entry) =>
    set(({ filterEntries }) => ({
      filterEntries: keepRecentEntries(filterEntries, entryKey, entry),
    })),
  saveScrollEntry: (entryKey, entry) =>
    set(({ scrollEntries }) => ({
      scrollEntries: keepRecentEntries(scrollEntries, entryKey, entry),
    })),
  clearEntries: () => set({ filterEntries: {}, scrollEntries: {} }),
}));

const readHistoryEntryKey = () => {
  if (typeof window === "undefined") return null;

  const entryKey: unknown = window.history.state?.[HISTORY_ENTRY_KEY];
  return typeof entryKey === "string" ? entryKey : null;
};

const ensureHistoryEntryKey = () => {
  const currentEntryKey = readHistoryEntryKey();
  if (currentEntryKey) return currentEntryKey;

  // 새로고침 후에도 기록에 남은 키와 겹치지 않도록 임의의 값을 사용함
  const entryKey = crypto.randomUUID();
  window.history.replaceState({ ...window.history.state, [HISTORY_ENTRY_KEY]: entryKey }, "");
  return entryKey;
};

// __NA가 포함된 상태를 넘기면 Next 라우터가 URL 변경을 반영하지 않으므로 복원용 키만 전달함
export const replaceProductListUrl = (url: string) => {
  const entryKey = readHistoryEntryKey();
  window.history.replaceState(entryKey ? { [HISTORY_ENTRY_KEY]: entryKey } : null, "", url);
};

// 렌더링 중 호출하므로 다른 목록 기록의 값이 섞이지 않도록 목록 식별자까지 비교함
export const readProductListFilter = (listId: string) => {
  const entryKey = readHistoryEntryKey();
  if (!entryKey) return null;

  const entry = useProductListRestoreStore.getState().filterEntries[entryKey];
  return entry?.listId === listId ? entry.filter : null;
};

export const saveProductListFilter = (listId: string, filter: ProductListFilterState) => {
  useProductListRestoreStore
    .getState()
    .saveFilterEntry(ensureHistoryEntryKey(), { listId, filter });
};

export const readProductListScrollTop = (listId: string) => {
  const entryKey = readHistoryEntryKey();
  if (!entryKey) return null;

  const entry = useProductListRestoreStore.getState().scrollEntries[entryKey];
  return entry?.listId === listId ? entry.scrollTop : null;
};

export const saveProductListScrollTop = (listId: string, scrollTop: number) => {
  useProductListRestoreStore
    .getState()
    .saveScrollEntry(ensureHistoryEntryKey(), { listId, scrollTop });
};

// 취향 분석 확정으로 목록과 가격 범위가 바뀌므로 분석 전 기록의 필터와 위치가 복원되지 않도록 모두 지움
export const clearProductListRestoreState = () => {
  useProductListRestoreStore.getState().clearEntries();
};
