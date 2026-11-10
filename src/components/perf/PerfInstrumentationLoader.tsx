// 성능 측정용 빌드에서만 계측 컴포넌트를 불러오는 로더 컴포넌트
"use client";

import dynamic from "next/dynamic";

// 서버 컴포넌트가 계측 컴포넌트를 직접 import하면 렌더링 여부와 관계없이 모든 페이지 청크에 포함되므로 로더에서 나눠 불러옴
// 일반 빌드에서 조건이 false로 고정되어 import 자체가 제거되도록 환경변수를 직접 비교함
const PerfInstrumentation =
  process.env.NEXT_PUBLIC_PERF_INSTRUMENT === "true"
    ? dynamic(() => import("@/components/perf/PerfInstrumentation"), { ssr: false })
    : null;

export default function PerfInstrumentationLoader() {
  return PerfInstrumentation ? <PerfInstrumentation /> : null;
}
