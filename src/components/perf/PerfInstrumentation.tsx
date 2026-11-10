// 성능 측정용으로 Web Vitals·Long Task·이미지 요청 지표를 수집하는 계측 컴포넌트
"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";

import { PERF_INSTRUMENT } from "@/lib/perf/config";
import { installPerfConsole, recordPerfMetric } from "@/lib/perf/recorder";

// CSS 배경 이미지도 포함하도록 요청 주소로 이미지 여부를 판단함
const IMAGE_URL_PATTERN = /(\.(avif|gif|jpe?g|png|svg|webp)(\?|$))|\/_next\/image\?/i;

function observePerformanceEntries(
  type: string,
  onEntry: (entry: PerformanceEntry) => void,
): PerformanceObserver | null {
  if (!PerformanceObserver.supportedEntryTypes.includes(type)) {
    return null;
  }

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(onEntry);
  });

  // 컴포넌트가 연결되기 전에 발생한 항목도 함께 수집함
  observer.observe({ type, buffered: true });
  return observer;
}

export default function PerfInstrumentation() {
  // LCP·CLS·INP 등은 페이지를 처음 불러온 경우에만 측정되고, CLS·INP는 탭을 숨기거나 이동할 때 확정됨
  useReportWebVitals((metric) => {
    if (!PERF_INSTRUMENT) {
      return;
    }

    recordPerfMetric(`web-vitals:${metric.name}`, metric.value, {
      rating: metric.rating,
      navigationType: metric.navigationType,
      pathname: window.location.pathname,
    });
  });

  useEffect(() => {
    if (!PERF_INSTRUMENT) {
      return;
    }

    installPerfConsole();

    const observers = [
      // 50ms 이상 메인 스레드를 점유해 화면 반응을 막은 작업
      observePerformanceEntries("longtask", (entry) => {
        recordPerfMetric("longtask", entry.duration, { startTime: entry.startTime });
      }),
      observePerformanceEntries("resource", (entry) => {
        const resource = entry as PerformanceResourceTiming;

        if (!IMAGE_URL_PATTERN.test(resource.name)) {
          return;
        }

        // 브라우저 캐시에서 불러온 이미지는 전송량이 0으로 기록됨
        recordPerfMetric("image:transfer-bytes", resource.transferSize, {
          url: resource.name,
          initiatorType: resource.initiatorType,
          duration: resource.duration,
        });
      }),
    ];

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  return null;
}
