// 상품 목록 첫 페이지가 DOM에 반영된 시점을 성능 측정 지표로 기록하는 훅
"use client";

import { useLayoutEffect } from "react";

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

// 현재 조건의 첫 페이지가 바뀐 렌더링이 DOM에 반영된 직후 기록함
// 이전 조건의 목록을 유지해 표시하는 동안에는 undefined를 전달해 기록하지 않음
export function useProductListFirstPagePerfMarks(firstPage: { items: unknown[] } | undefined) {
  // 화면에 그려지기 전, DOM 반영 직후 시점에 기록하도록 useLayoutEffect 사용
  // 다음 페이지를 이어 불러올 때는 첫 페이지 객체가 그대로이므로 다시 기록하지 않음
  useLayoutEffect(() => {
    if (!PERF_INSTRUMENT || firstPage === undefined) {
      return;
    }

    const productCount = firstPage.items.length;

    recordProductListPageLoad(productCount);
    markPerfEnd(PERF_METRIC.productListFilterChange, { productCount });
  }, [firstPage]);
}
