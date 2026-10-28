// 성능 측정 지표를 회차별로 기록하고 브라우저 콘솔에서 요약을 확인하는 계측 유틸 함수 모음
"use client";

import { PERF_INSTRUMENT } from "@/lib/perf/config";

export type PerfMetricDetail = Record<string, unknown>;

export interface PerfMetricEntry {
  name: string;
  value: number;
  // 페이지 진입 후 기록 시점(ms)
  recordedAt: number;
  detail?: PerfMetricDetail;
}

interface PerfMetricSummary {
  name: string;
  count: number;
  // 이미지 전송량·Long Task 시간처럼 합계가 필요한 지표 확인용
  total: number;
  median: number;
  min: number;
  max: number;
}

interface PerfConsole {
  summary: () => PerfMetricSummary[];
  entries: () => PerfMetricEntry[];
  reset: () => void;
}

declare global {
  interface Window {
    __perf?: PerfConsole;
  }
}

const perfEntries: PerfMetricEntry[] = [];

const getStartMarkName = (name: string) => `${name}:start`;

const roundMetricValue = (value: number) => Math.round(value * 10) / 10;

function getMedian(values: number[]) {
  const sortedValues = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedValues.length / 2);

  return sortedValues.length % 2 === 0
    ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
    : sortedValues[middleIndex];
}

export function recordPerfMetric(name: string, value: number, detail?: PerfMetricDetail) {
  if (!PERF_INSTRUMENT) {
    return;
  }

  perfEntries.push({ name, value, recordedAt: performance.now(), detail });
}

// 같은 구간을 다시 시작하면 이전 시작 지점을 지우고 새로 기록함
export function markPerfStart(name: string) {
  if (!PERF_INSTRUMENT) {
    return;
  }

  const startMarkName = getStartMarkName(name);

  performance.clearMarks(startMarkName);
  performance.mark(startMarkName);
}

// 시작 지점이 없으면 기록하지 않고, 기록 후 시작 지점을 지워 한 번의 시작에 한 번만 기록함
export function markPerfEnd(name: string, detail?: PerfMetricDetail) {
  if (!PERF_INSTRUMENT) {
    return;
  }

  const startMarkName = getStartMarkName(name);

  if (performance.getEntriesByName(startMarkName, "mark").length === 0) {
    return;
  }

  const measure = performance.measure(name, startMarkName);

  performance.clearMarks(startMarkName);
  recordPerfMetric(name, measure.duration, detail);
}

function summarizePerfMetrics() {
  const valuesByName = new Map<string, number[]>();

  perfEntries.forEach(({ name, value }) => {
    valuesByName.set(name, [...(valuesByName.get(name) ?? []), value]);
  });

  return Array.from(valuesByName, ([name, values]) => ({
    name,
    count: values.length,
    total: roundMetricValue(values.reduce((sum, value) => sum + value, 0)),
    median: roundMetricValue(getMedian(values)),
    min: roundMetricValue(Math.min(...values)),
    max: roundMetricValue(Math.max(...values)),
  }));
}

// 브라우저 콘솔에서 window.__perf.summary()·entries()·reset()으로 측정 결과를 확인함
export function installPerfConsole() {
  if (!PERF_INSTRUMENT || window.__perf) {
    return;
  }

  window.__perf = {
    summary: () => {
      const summary = summarizePerfMetrics();

      // 측정 결과를 표로 확인하는 계측 전용 출력이므로 허용함
      // eslint-disable-next-line no-console
      console.table(summary);
      return summary;
    },
    entries: () => [...perfEntries],
    reset: () => {
      perfEntries.length = 0;
      performance.clearMarks();
      performance.clearMeasures();
    },
  };
}
