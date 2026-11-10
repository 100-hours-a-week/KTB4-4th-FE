// 감싼 영역의 렌더링 횟수와 시간을 성능 측정 지표로 기록하는 React Profiler 래퍼 컴포넌트
"use client";

import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react";

import { PERF_INSTRUMENT } from "@/lib/perf/config";
import { recordPerfMetric } from "@/lib/perf/recorder";

type PerfProfilerProps = {
  id: string;
  children: ReactNode;
};

// 렌더링이 일어난 커밋마다 호출되며, 지표 이름에 mount·update를 나눠 첫 렌더링과 다시 렌더링을 구분함
const handleRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  recordPerfMetric(`render:${id}:${phase}`, actualDuration, { baseDuration });
};

// 프로덕션 빌드에서는 next build --profile로 빌드한 경우에만 onRender가 호출됨
export default function PerfProfiler({ id, children }: PerfProfilerProps) {
  if (!PERF_INSTRUMENT) {
    return children;
  }

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
}
