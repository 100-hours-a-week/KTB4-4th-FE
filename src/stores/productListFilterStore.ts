// 뒤로 가기 복원을 위한 상품 목록 방문 기록별 필터 상태 관리 스토어

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

type ProductListFilterStoreState = {
  entries: Record<string, ProductListFilterEntry>;
  saveEntry: (entryKey: string, entry: ProductListFilterEntry) => void;
};

const useProductListFilterStore = create<ProductListFilterStoreState>()((set) => ({
  entries: {},
  saveEntry: (entryKey, entry) =>
    set(({ entries }) => {
      // 객체의 키 순서를 저장 순서로 사용하므로 기존 항목을 지운 뒤 맨 뒤에 다시 추가함
      const { [entryKey]: _previousEntry, ...otherEntries } = entries;
      const recentEntries = Object.entries({ ...otherEntries, [entryKey]: entry }).slice(
        -MAX_ENTRY_COUNT,
      );

      return { entries: Object.fromEntries(recentEntries) };
    }),
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

  const entry = useProductListFilterStore.getState().entries[entryKey];
  return entry?.listId === listId ? entry.filter : null;
};

export const saveProductListFilter = (listId: string, filter: ProductListFilterState) => {
  useProductListFilterStore.getState().saveEntry(ensureHistoryEntryKey(), { listId, filter });
};
