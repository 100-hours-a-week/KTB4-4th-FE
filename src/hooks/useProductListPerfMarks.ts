// 상품 목록 첫 페이지가 DOM에 반영된 시점을 성능 측정 지표로 기록하는 훅
"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

import { PERF_INSTRUMENT } from "@/lib/perf/config";
import { PERF_METRIC } from "@/lib/perf/metrics";
import { markPerfEnd, recordPerfMetric } from "@/lib/perf/recorder";

// 문서를 새로 불러온 뒤 처음 표시된 목록만 페이지 로드 지표로 기록함
let hasRecordedPageLoad = false;

function recordProductListPageLoad(productCount: number) {
  if (hasRecordedPageLoad) {
    return;
  }

  hasRecordedPageLoad = true;

  const [navigation] = performance.getEntriesByType("navigation");

  // 다른 화면에서 앱 안 이동으로 들어온 경우 문서 로드부터 잰 시간이 아니므로 기록하지 않음
  if (!navigation || new URL(navigation.name).pathname !== window.location.pathname) {
    return;
  }

  recordPerfMetric(PERF_METRIC.productListPageLoad, performance.now(), {
    productCount,
    pathname: window.location.pathname,
  });
}

// 반환한 함수를 첫 페이지 응답을 상태에 반영할 때 호출하면, 해당 렌더링이 DOM에 반영된 직후 기록함
export function useProductListPerfMarks(productCount: number) {
  const isFirstPagePendingRef = useRef(false);

  // 화면에 그려지기 전, DOM 반영 직후 시점에 기록하도록 useLayoutEffect 사용
  useLayoutEffect(() => {
    if (!PERF_INSTRUMENT || !isFirstPagePendingRef.current) {
      return;
    }

    isFirstPagePendingRef.current = false;
    recordProductListPageLoad(productCount);
    markPerfEnd(PERF_METRIC.productListFilterChange, { productCount });
  });

  return useCallback(() => {
    if (PERF_INSTRUMENT) {
      isFirstPagePendingRef.current = true;
    }
  }, []);
}
